"""团队相关 API"""
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..client import APIClient

from ..models import TeamInfo


class TeamsEndpoint:
    """团队相关 API 端点"""

    def __init__(self, client: "APIClient"):
        self.client = client

    async def get_teams(self) -> List[TeamInfo]:
        """
        获取开放的团队列表

        Returns:
            List[TeamInfo]: 团队列表
        """
        data = await self.client.request(
            "GET",
            f"/api/v2/bot/guilds/{self.client.guild_id}/teams"
        )
        return [TeamInfo(**team) for team in data]

    async def get_team_detail(self, team_id: int) -> TeamInfo:
        """
        获取团队详情

        Args:
            team_id: 团队 ID

        Returns:
            TeamInfo: 团队信息

        Note:
            此接口可能需要后端新增支持
        """
        data = await self.client.request(
            "GET",
            f"/api/v2/bot/guilds/{self.client.guild_id}/teams/{team_id}"
        )
        return TeamInfo(**data)
