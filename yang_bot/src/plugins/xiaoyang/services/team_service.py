"""团队业务逻辑服务"""
from typing import List
from ..api.client import APIClient
from ..api.models import TeamInfo


class TeamService:
    """团队业务逻辑服务"""

    def __init__(self, api_client: APIClient):
        self.api_client = api_client

    async def get_teams(self) -> List[TeamInfo]:
        """
        获取开放的团队列表

        Returns:
            List[TeamInfo]: 团队列表
        """
        return await self.api_client.teams.get_teams()

    async def get_team_by_index(self, teams: List[TeamInfo], index: int) -> TeamInfo:
        """
        通过序号获取团队

        Args:
            teams: 团队列表
            index: 序号 (从1开始)

        Returns:
            TeamInfo: 团队信息

        Raises:
            ValueError: 序号无效
        """
        if index < 1 or index > len(teams):
            raise ValueError(f"序号无效，请输入 1-{len(teams)} 之间的数字")

        return teams[index - 1]
