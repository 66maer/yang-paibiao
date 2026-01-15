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
from app.models.signup import Signup
from app.models.team import Team


class RankingService:
    """排名计算服务"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_rank_modifier(self, heibenren_count: int) -> Decimal:
        """
        计算Rank修正系数
        公式：1 + 0.2(1 - e^(-(N-5)/5))

        Args:
            heibenren_count: 黑本次数

        Returns:
            Rank修正系数
        """
        N = heibenren_count
        exponent = -(N - 5) / 5
        modifier = 1 + 0.2 * (1 - math.exp(exponent))
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
        car_number_map: Optional[Dict[int, int]] = None,
        include_detail: bool = False
    ) -> Optional[Dict]:
        """
        计算单个用户的排名数据

        Args:
            guild_id: 群组ID
            user_id: 用户ID
            car_number_map: 车次映射（可选，如果未提供则内部计算）
            include_detail: 是否包含详细计算过程

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

        # 近期加权系数（倒序：最近5车分别为1.5、1.35、1.2、1.1、1.05）
        recent_weights = [Decimal("1.5"), Decimal("1.35"), Decimal("1.2"), Decimal("1.1"), Decimal("1.05")]

        # 计算修正后的总金额
        corrected_total = Decimal("0")
        weighted_total = Decimal("0")
        total_gold = 0
        record_details = []
        total_record_count = len(records)

        for idx, record in enumerate(records):
            factor = await self.get_correction_factor(record.dungeon, record.run_date)
            corrected_gold = Decimal(str(record.total_gold)) * factor
            corrected_total += corrected_gold
            total_gold += record.total_gold

            # 计算近期加权系数（倒数第1-5条记录有额外权重）
            reverse_idx = total_record_count - idx - 1  # 从末尾开始计数，0表示最后一条
            if reverse_idx < len(recent_weights):
                recent_weight = recent_weights[reverse_idx]
            else:
                recent_weight = Decimal("1.0")
            
            weighted_gold = corrected_gold * recent_weight
            weighted_total += weighted_gold

            # 如果需要详细信息，收集每条记录的详情
            if include_detail:
                record_details.append({
                    "record_id": record.id,
                    "dungeon": record.dungeon,
                    "run_date": record.run_date,
                    "gold": record.total_gold,
                    "correction_factor": factor,
                    "corrected_gold": corrected_gold,
                    "recent_weight": recent_weight,
                    "weighted_gold": weighted_gold
                })

        # 计算各项指标
        heibenren_count = len(records)
        average_gold = Decimal(str(total_gold)) / Decimal(str(heibenren_count))
        corrected_average_gold = corrected_total / Decimal(str(heibenren_count))
        
        # 计算加权平均金额（考虑近期加权）
        # 权重总和 = min(次数, 5)个近期权重 + max(0, 次数-5)个1.0权重
        num_weighted = min(heibenren_count, len(recent_weights))
        weight_sum = sum(recent_weights[:num_weighted]) + Decimal(str(max(0, heibenren_count - len(recent_weights))))
        weighted_average_gold = weighted_total / weight_sum
        
        # 除以基准值5000
        normalized_average_gold = weighted_average_gold / Decimal("5000")
        rank_modifier = await self.calculate_rank_modifier(heibenren_count)
        rank_score = normalized_average_gold * rank_modifier

        # 最近一次黑本信息
        last_record = records[-1]
        last_heibenren_date = last_record.run_date
        last_heibenren_car_number = car_number_map.get(last_record.id)

        result_data = {
            "user_id": user_id,
            "heibenren_count": heibenren_count,
            "total_gold": total_gold,
            "average_gold": average_gold,
            "corrected_average_gold": corrected_average_gold,
            "rank_score": rank_score,
            "last_heibenren_date": last_heibenren_date,
            "last_heibenren_car_number": last_heibenren_car_number,
        }

        # 如果需要详细信息，添加计算详情
        if include_detail:
            result_data["calculation_detail"] = {
                "records": record_details,
                "total_gold": total_gold,
                "corrected_total_gold": corrected_total,
                "weighted_total_gold": weighted_total,
                "heibenren_count": heibenren_count,
                "average_gold": average_gold,
                "corrected_average_gold": corrected_average_gold,
                "weighted_average_gold": weighted_average_gold,
                "rank_modifier": rank_modifier,
                "rank_score": rank_score
            }

        return result_data

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

    async def calculate_guild_rankings(self, guild_id: int, include_detail: bool = False) -> List[Dict]:
        """
        计算群组的完整排名

        Args:
            guild_id: 群组ID
            include_detail: 是否包含详细计算过程

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
            user_data = await self.calculate_user_ranking_data(guild_id, user_id, car_number_map, include_detail)
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
        # 获取所有不同的快照时间，按时间倒序排列
        distinct_times_result = await self.db.execute(
            select(RankingSnapshot.snapshot_date)
            .where(RankingSnapshot.guild_id == guild_id)
            .distinct()
            .order_by(RankingSnapshot.snapshot_date.desc())
            .limit(2)
        )
        distinct_times = [row[0] for row in distinct_times_result.all()]

        # 如果少于2个不同的快照时间，说明没有可比较的历史数据
        if len(distinct_times) < 2:
            # 没有足够的历史快照，所有人都是新上榜
            return {
                ranking["user_id"]: {"change": "new", "value": 0}
                for ranking in current_rankings
            }

        # 使用倒数第二次快照时间（即上一次快照）
        previous_snapshot_time = distinct_times[1]

        # 获取上一次快照的所有记录
        result = await self.db.execute(
            select(RankingSnapshot)
            .where(
                and_(
                    RankingSnapshot.guild_id == guild_id,
                    RankingSnapshot.snapshot_date == previous_snapshot_time
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

    def calculate_frequency_modifier(self, heibenren_count: int) -> Decimal:
        """
        计算频次修正系数

        Args:
            heibenren_count: 黑本次数

        Returns:
            频次修正系数
        """
        if heibenren_count == 1:
            return Decimal("1.25")
        elif heibenren_count == 2:
            return Decimal("1.1")
        elif heibenren_count == 3:
            return Decimal("1.05")
        else:
            return Decimal("1.0")

    async def calculate_cars_since_last_heibenren(
        self,
        guild_id: int,
        last_heibenren_record_id: int,
        car_number_map: Dict[int, int]
    ) -> int:
        """
        计算距离上次黑本的车次数

        Args:
            guild_id: 群组ID
            last_heibenren_record_id: 最近一次黑本记录ID
            car_number_map: 车次映射

        Returns:
            距离上次黑本的车次数
        """
        # 获取该记录的车次
        last_car_number = car_number_map.get(last_heibenren_record_id)
        if last_car_number is None:
            return 0

        # 获取总车次数
        max_car_number = max(car_number_map.values()) if car_number_map else 0

        # 返回差值
        return max_car_number - last_car_number

    def calculate_time_modifier(self, cars_since_last: int) -> Decimal:
        """
        计算时间修正系数
        公式：ln(1 + e^(0.05(x-33))) + 0.83，其中 x 为距离上次黑本的车次数

        Args:
            cars_since_last: 距离上次黑本的车次数

        Returns:
            时间修正系数
        """
        x = cars_since_last
        # 计算 e^(0.05(x-33))
        exp_term = math.exp(0.05 * (x - 33))
        # 计算 ln(1 + e^(0.05(x-33))) + 0.83
        modifier = math.log(1 + exp_term) + 0.83
        return Decimal(str(round(modifier, 4)))

    async def calculate_participation_penalty(
        self,
        guild_id: int,
        user_id: int
    ) -> tuple[Decimal, int, List[Dict]]:
        """
        计算参与度惩罚系数（用于惩罚长期不跟车的用户）
        
        规则：
        - 找到用户倒数第三次跟车的记录
        - 计算该记录距离最新开团的车次差 x
        - 使用公式：1/(1+e^(0.1(x-50))) 计算
        - 结果 > 0.9 置为 1，< 0.1 置为 0.1
        - 跟车次数不足3次，直接返回 0.1

        Args:
            guild_id: 群组ID
            user_id: 用户ID

        Returns:
            (参与度惩罚系数, 倒数第三次跟车距今的车次差, 最近3次跟车详情)
        """
        # 获取该群组所有开团列表（按时间倒序）
        recent_teams_result = await self.db.execute(
            select(Team.id)
            .where(
                and_(
                    Team.guild_id == guild_id,
                    Team.status.in_(["open", "completed"])  # 只看有效的开团
                )
            )
            .order_by(Team.team_time.desc())
            .limit(100)  # 取足够多的开团用于计算
        )
        recent_team_ids = [row[0] for row in recent_teams_result.all()]

        if not recent_team_ids:
            # 没有开团记录，返回系数1
            return Decimal("1.0"), 0, []

        # 查询该用户在这些开团中的报名记录（未取消的）
        signups_result = await self.db.execute(
            select(Signup.team_id)
            .where(
                and_(
                    Signup.team_id.in_(recent_team_ids),
                    Signup.signup_user_id == user_id,
                    Signup.cancelled_at.is_(None)  # 未取消
                )
            )
        )
        participated_team_ids = set(row[0] for row in signups_result.all())

        # 找到用户跟车的记录（按开团时间倒序排列）
        user_participations = []
        for idx, team_id in enumerate(recent_team_ids):
            if team_id in participated_team_ids:
                user_participations.append(idx)  # idx 就是距离最新开团的车次差

        # 收集最近3次跟车的车次差（只需要车次，不需要系数）
        recent_3_participations = [cars_ago for cars_ago in user_participations[:3]]

        # 跟车次数不足3次，直接返回 0.1
        if len(user_participations) < 3:
            return Decimal("0.1"), len(recent_team_ids) if not user_participations else user_participations[-1], recent_3_participations

        # 取倒数第三次跟车距今的车次差
        x = user_participations[2]  # 第三次跟车（索引2）

        # 使用公式计算：1/(1+e^(0.1(x-50)))
        exp_term = math.exp(0.1 * (x - 50))
        modifier = 1 / (1 + exp_term)
        
        # 结果 > 0.9 置为 1，< 0.1 置为 0.1
        if modifier > 0.9:
            modifier = 1.0
        elif modifier < 0.1:
            modifier = 0.1
        
        return Decimal(str(round(modifier, 4))), x, recent_3_participations

    async def calculate_heibenren_recommendations(
        self,
        guild_id: int,
        member_user_ids: List[Optional[int]]
    ) -> tuple[List[Dict], Decimal]:
        """
        计算黑本推荐列表

        Args:
            guild_id: 群组ID
            member_user_ids: 团队成员用户ID列表（可包含None值）

        Returns:
            (推荐列表（按推荐分降序排序）, 平均红黑分)
        """
        # 过滤掉 None 值并去重
        valid_user_ids = list(set([uid for uid in member_user_ids if uid is not None]))

        # 计算群组当前排名（不需要详细信息）
        current_rankings = await self.calculate_guild_rankings(guild_id, include_detail=False)

        # 构建排名映射
        ranking_map = {r["user_id"]: r for r in current_rankings}

        # 计算平均红黑分（仅针对有黑本记录的用户）
        rank_scores = [r["rank_score"] for r in current_rankings]
        average_rank_score = sum(rank_scores) / len(rank_scores) if rank_scores else Decimal("0")

        # 获取车次映射
        car_number_map = await self._get_car_number_map(guild_id)

        # 计算每个成员的推荐分
        recommendations = []
        for user_id in valid_user_ids:
            ranking_data = ranking_map.get(user_id)

            # 计算参与度惩罚系数（对所有用户都计算）
            participation_modifier, teams_since_last_participation, recent_3_participations = await self.calculate_participation_penalty(
                guild_id, user_id
            )

            if ranking_data is None:
                # 无黑本记录的用户，使用平均红黑分的4倍
                rank_score = average_rank_score * Decimal("4")
                frequency_modifier = Decimal("1.0")
                time_modifier = Decimal("1.0")
                # 推荐分 = 红黑分 × 参与度惩罚系数
                recommendation_score = rank_score * participation_modifier

                recommendations.append({
                    "user_id": user_id,
                    "rank_score": rank_score,
                    "heibenren_count": 0,
                    "frequency_modifier": frequency_modifier,
                    "time_modifier": time_modifier,
                    "participation_modifier": participation_modifier,
                    "teams_since_last_participation": teams_since_last_participation if participation_modifier < Decimal("1.0") else None,
                    "recent_3_participations": recent_3_participations,
                    "recommendation_score": recommendation_score,
                    "last_heibenren_date": None,
                    "cars_since_last": None,
                    "is_new": True
                })
            else:
                # 有黑本记录的用户
                rank_score = ranking_data["rank_score"]
                heibenren_count = ranking_data["heibenren_count"]

                # 计算频次修正系数
                frequency_modifier = self.calculate_frequency_modifier(heibenren_count)

                # 计算车次差
                last_record_id = None
                # 需要找到该用户最后一条黑本记录的ID
                result = await self.db.execute(
                    select(GoldRecord.id)
                    .where(
                        and_(
                            GoldRecord.guild_id == guild_id,
                            GoldRecord.heibenren_user_id == user_id,
                            GoldRecord.deleted_at.is_(None)
                        )
                    )
                    .order_by(GoldRecord.run_date.desc(), GoldRecord.id.desc())
                    .limit(1)
                )
                last_record = result.scalar_one_or_none()

                if last_record:
                    cars_since_last = await self.calculate_cars_since_last_heibenren(
                        guild_id, last_record, car_number_map
                    )
                else:
                    cars_since_last = 0

                # 计算时间修正系数
                time_modifier = self.calculate_time_modifier(cars_since_last)

                # 计算推荐分 = 红黑分 × 频次修正系数 × 时间修正系数 × 参与度惩罚系数
                recommendation_score = rank_score * frequency_modifier * time_modifier * participation_modifier

                recommendations.append({
                    "user_id": user_id,
                    "rank_score": rank_score,
                    "heibenren_count": heibenren_count,
                    "frequency_modifier": frequency_modifier,
                    "time_modifier": time_modifier,
                    "participation_modifier": participation_modifier,
                    "teams_since_last_participation": teams_since_last_participation if participation_modifier < Decimal("1.0") else None,
                    "recent_3_participations": recent_3_participations,
                    "recommendation_score": recommendation_score,
                    "last_heibenren_date": ranking_data.get("last_heibenren_date"),
                    "cars_since_last": cars_since_last,
                    "is_new": False
                })

        # 按推荐分降序排序
        recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)

        return recommendations, average_rank_score
