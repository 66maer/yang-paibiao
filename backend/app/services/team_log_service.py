"""
团队日志服务
"""
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.team_log import TeamLog


class TeamLogService:
    """团队日志服务类"""

    @staticmethod
    async def create_log(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        action_type: str,
        action_user_id: Optional[int],
        action_detail: Dict[str, Any]
    ) -> TeamLog:
        """创建日志记录"""
        log = TeamLog(
            team_id=team_id,
            guild_id=guild_id,
            action_type=action_type,
            action_user_id=action_user_id,
            action_detail=action_detail
        )
        db.add(log)
        await db.flush()  # 不立即提交，等待外层事务提交
        return log

    @staticmethod
    async def log_team_created(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        user_id: int,
        title: str,
        dungeon: str,
        team_time: str
    ):
        """记录开团"""
        await TeamLogService.create_log(
            db, team_id, guild_id, "team_created", user_id,
            {"title": title, "dungeon": dungeon, "team_time": team_time, "changes": None}
        )

    @staticmethod
    async def log_team_updated(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        user_id: int,
        changes: Dict[str, Dict[str, Any]]
    ):
        """记录团队编辑"""
        if changes:  # 只有有变化时才记录
            await TeamLogService.create_log(
                db, team_id, guild_id, "team_updated", user_id,
                {"changes": changes}
            )

    @staticmethod
    async def log_team_closed(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        user_id: int,
        status: str
    ):
        """记录关闭团队"""
        await TeamLogService.create_log(
            db, team_id, guild_id, "team_closed", user_id,
            {"status": status}
        )

    @staticmethod
    async def log_team_reopened(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        user_id: int,
        previous_status: str
    ):
        """记录重新开启团队"""
        await TeamLogService.create_log(
            db, team_id, guild_id, "team_reopened", user_id,
            {"previous_status": previous_status}
        )

    @staticmethod
    async def log_team_deleted(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        user_id: int
    ):
        """记录删除团队"""
        await TeamLogService.create_log(
            db, team_id, guild_id, "team_deleted", user_id, {}
        )

    @staticmethod
    async def log_signup_created(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        user_id: int,
        signup_id: int,
        player_name: str,
        character_name: str,
        xinfa: str,
        is_proxy: bool,
        is_rich: bool,
        slot_position: Optional[int] = None,
        submitter_name: Optional[str] = None
    ):
        """记录报名"""
        detail = {
            "signup_id": signup_id,
            "player_name": player_name,
            "character_name": character_name,
            "xinfa": xinfa,
            "is_proxy": is_proxy,
            "is_rich": is_rich,
            "slot_position": slot_position
        }
        if is_proxy and submitter_name:
            detail["submitter_name"] = submitter_name

        await TeamLogService.create_log(
            db, team_id, guild_id, "signup_created", user_id, detail
        )

    @staticmethod
    async def log_signup_cancelled(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        user_id: int,
        signup_id: int,
        player_name: str,
        character_name: str,
        xinfa: str,
        cancelled_by_self: bool
    ):
        """记录取消报名"""
        await TeamLogService.create_log(
            db, team_id, guild_id, "signup_cancelled", user_id,
            {
                "signup_id": signup_id,
                "player_name": player_name,
                "character_name": character_name,
                "xinfa": xinfa,
                "cancelled_by_self": cancelled_by_self
            }
        )

    @staticmethod
    async def log_slot_assigned(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        user_id: int,
        signup_id: int,
        player_name: str,
        character_name: str,
        xinfa: str,
        slot_position: int
    ):
        """记录分配坑位"""
        await TeamLogService.create_log(
            db, team_id, guild_id, "slot_assigned", user_id,
            {
                "signup_id": signup_id,
                "player_name": player_name,
                "character_name": character_name,
                "xinfa": xinfa,
                "slot_position": slot_position
            }
        )

    @staticmethod
    async def log_slot_unassigned(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        user_id: int,
        signup_id: int,
        player_name: str,
        slot_position: int
    ):
        """记录取消坑位分配"""
        await TeamLogService.create_log(
            db, team_id, guild_id, "slot_unassigned", user_id,
            {
                "signup_id": signup_id,
                "player_name": player_name,
                "slot_position": slot_position
            }
        )

    @staticmethod
    async def log_presence_marked(
        db: AsyncSession,
        team_id: int,
        guild_id: int,
        user_id: int,
        signup_id: int,
        player_name: str,
        presence_status: Optional[str],
        previous_status: Optional[str]
    ):
        """记录进组标记"""
        await TeamLogService.create_log(
            db, team_id, guild_id, "signup_presence_marked", user_id,
            {
                "signup_id": signup_id,
                "player_name": player_name,
                "presence_status": presence_status,
                "previous_status": previous_status
            }
        )
