"""
排名计算服务
"""
from datetime import date, datetime
from decimal import Decimal
import math
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func

from app.models.gold_record import GoldRecord
from app.models.ranking_snapshot import RankingSnapshot
from app.models.season_correction_factor import SeasonCorrectionFactor


class RankingService:
    """排名计算服务"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_rank_modifier(self, heibenren_count: int) -> Decimal:
        """
        计算Rank修正系数
        公式：1 + 0.5(1 - e^(-(N-5)/5))

        Args:
            heibenren_count: 黑本次数

        Returns:
            Rank修正系数
        """
        N = heibenren_count
        exponent = -(N - 5) / 5
        modifier = 1 + 0.5 * (1 - math.exp(exponent))
        return Decimal(str(round(modifier, 4)))

    async def get_correction_factor(
        self,
        dungeon: str,
        run_date: date
    ) -> Decimal:
        """
        获取指定副本和日期的修正系数

        Args:
            dungeon: 副本名称
            run_date: 运行日期

        Returns:
            修正系数（如果没有配置则返回1.00）
        """
        result = await self.db.execute(
            select(SeasonCorrectionFactor)
            .where(
                and_(
                    SeasonCorrectionFactor.dungeon == dungeon,
                    SeasonCorrectionFactor.start_date <= run_date,
                    or_(
                        SeasonCorrectionFactor.end_date.is_(None),
                        SeasonCorrectionFactor.end_date >= run_date
                    )
                )
            )
            .order_by(SeasonCorrectionFactor.start_date.desc())
            .limit(1)
        )
        factor = result.scalar_one_or_none()
        return factor.correction_factor if factor else Decimal("1.00")

    async def calculate_user_ranking_data(
        self,
        guild_id: int,
        user_id: int,
        car_number_map: Optional[Dict[int, int]] = None
    ) -> Optional[Dict]:
        """
        计算单个用户的排名数据

        Args:
            guild_id: 群组ID
            user_id: 用户ID
            car_number_map: 车次映射（可选，如果未提供则内部计算）

        Returns:
            包含排名数据的字典，如果用户没有黑本记录则返回None
        """
        # 获取该用户在该群组的所有黑本记录
        result = await self.db.execute(
            select(GoldRecord)
            .where(
                and_(
                    GoldRecord.guild_id == guild_id,
                    GoldRecord.heibenren_user_id == user_id,
                    GoldRecord.deleted_at.is_(None)
                )
            )
            .order_by(GoldRecord.run_date.asc(), GoldRecord.id.asc())
        )
        records = result.scalars().all()

        if not records:
            return None

        # 如果没有提供车次映射，则计算
        if car_number_map is None:
            car_number_map = await self._get_car_number_map(guild_id)

        # 计算修正后的总金额
        corrected_total = Decimal("0")
        total_gold = 0

        for record in records:
            factor = await self.get_correction_factor(record.dungeon, record.run_date)
            corrected_total += Decimal(str(record.total_gold)) * factor
            total_gold += record.total_gold

        # 计算各项指标
        heibenren_count = len(records)
        average_gold = Decimal(str(total_gold)) / Decimal(str(heibenren_count))
        corrected_average_gold = corrected_total / Decimal(str(heibenren_count))
        rank_modifier = await self.calculate_rank_modifier(heibenren_count)
        rank_score = corrected_average_gold * rank_modifier

        # 最近一次黑本信息
        last_record = records[-1]
        last_heibenren_date = last_record.run_date
        last_heibenren_car_number = car_number_map.get(last_record.id)

        return {
            "user_id": user_id,
            "heibenren_count": heibenren_count,
            "total_gold": total_gold,
            "average_gold": average_gold,
            "corrected_average_gold": corrected_average_gold,
            "rank_score": rank_score,
            "last_heibenren_date": last_heibenren_date,
            "last_heibenren_car_number": last_heibenren_car_number,
        }

    async def _get_car_number_map(self, guild_id: int) -> Dict[int, int]:
        """
        获取车次映射（金团记录ID -> 车次）

        Args:
            guild_id: 群组ID

        Returns:
            车次映射字典
        """
        all_records_result = await self.db.execute(
            select(GoldRecord.id, GoldRecord.run_date)
            .where(
                and_(
                    GoldRecord.guild_id == guild_id,
                    GoldRecord.deleted_at.is_(None)
                )
            )
            .order_by(GoldRecord.run_date.asc(), GoldRecord.id.asc())
        )
        all_records = all_records_result.all()
        return {record.id: idx + 1 for idx, record in enumerate(all_records)}

    async def calculate_guild_rankings(self, guild_id: int) -> List[Dict]:
        """
        计算群组的完整排名

        Args:
            guild_id: 群组ID

        Returns:
            排名列表（按rank_score降序）
        """
        # 获取该群组所有有黑本记录的用户
        result = await self.db.execute(
            select(GoldRecord.heibenren_user_id)
            .where(
                and_(
                    GoldRecord.guild_id == guild_id,
                    GoldRecord.heibenren_user_id.isnot(None),
                    GoldRecord.deleted_at.is_(None)
                )
            )
            .distinct()
        )
        user_ids = [row[0] for row in result.all()]

        # 预先计算车次映射（避免重复计算）
        car_number_map = await self._get_car_number_map(guild_id)

        # 计算每个用户的排名数据
        rankings = []
        for user_id in user_ids:
            user_data = await self.calculate_user_ranking_data(guild_id, user_id, car_number_map)
            if user_data:
                rankings.append(user_data)

        # 按 rank_score 降序排序
        rankings.sort(key=lambda x: x["rank_score"], reverse=True)

        # 添加排名位置
        for idx, ranking in enumerate(rankings):
            ranking["rank_position"] = idx + 1

        return rankings

    async def save_ranking_snapshot(
        self,
        guild_id: int,
        rankings: List[Dict]
    ) -> None:
        """
        保存排名快照

        Args:
            guild_id: 群组ID
            rankings: 排名数据列表
        """
        snapshot_date = datetime.utcnow()

        for ranking in rankings:
            snapshot = RankingSnapshot(
                guild_id=guild_id,
                user_id=ranking["user_id"],
                rank_position=ranking["rank_position"],
                rank_score=ranking["rank_score"],
                heibenren_count=ranking["heibenren_count"],
                total_gold=ranking["total_gold"],
                average_gold=ranking["average_gold"],
                corrected_average_gold=ranking["corrected_average_gold"],
                last_heibenren_date=ranking["last_heibenren_date"],
                last_heibenren_car_number=ranking["last_heibenren_car_number"],
                snapshot_date=snapshot_date,
            )
            self.db.add(snapshot)

        await self.db.commit()

    async def get_ranking_changes(
        self,
        guild_id: int,
        current_rankings: List[Dict]
    ) -> Dict[int, Dict]:
        """
        获取排名变化信息（与上一次快照比较）

        Args:
            guild_id: 群组ID
            current_rankings: 当前排名列表

        Returns:
            用户ID -> 变化信息的映射
        """
        # 获取上一次快照的时间
        subquery = (
            select(func.max(RankingSnapshot.snapshot_date))
            .where(RankingSnapshot.guild_id == guild_id)
        )

        # 获取上一次快照的所有记录
        result = await self.db.execute(
            select(RankingSnapshot)
            .where(
                and_(
                    RankingSnapshot.guild_id == guild_id,
                    RankingSnapshot.snapshot_date == subquery.scalar_subquery()
                )
            )
        )
        last_snapshots = result.scalars().all()

        if not last_snapshots:
            # 没有历史快照，所有人都是新上榜
            return {
                ranking["user_id"]: {"change": "new", "value": 0}
                for ranking in current_rankings
            }

        # 构建上一次排名映射
        last_rank_map = {
            snapshot.user_id: snapshot.rank_position
            for snapshot in last_snapshots
        }

        # 计算变化
        changes = {}
        for ranking in current_rankings:
            user_id = ranking["user_id"]
            current_rank = ranking["rank_position"]

            if user_id not in last_rank_map:
                changes[user_id] = {"change": "new", "value": 0}
            else:
                last_rank = last_rank_map[user_id]
                diff = last_rank - current_rank  # 正数表示排名上升（从大到小）

                if diff > 0:
                    changes[user_id] = {"change": "up", "value": diff}
                elif diff < 0:
                    changes[user_id] = {"change": "down", "value": abs(diff)}
                else:
                    changes[user_id] = {"change": "same", "value": 0}

        return changes
