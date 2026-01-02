"""报名相关 API"""
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..client import APIClient

from ..models import SignupRequest, SignupInfo


class SignupsEndpoint:
    """报名相关 API 端点"""

    def __init__(self, client: "APIClient"):
        self.client = client

    async def create_signup(
        self,
        team_id: int,
        request: SignupRequest
    ) -> SignupInfo:
        """
        创建报名

        Args:
            team_id: 团队 ID
            request: 报名请求

        Returns:
            SignupInfo: 报名信息
        """
        data = await self.client.request(
            "POST",
            f"/api/v2/bot/guilds/{self.client.guild_id}/teams/{team_id}/signups",
            json=request.model_dump(exclude_none=True)
        )
        return SignupInfo(**data)

    async def cancel_signup(
        self,
        team_id: int,
        qq_number: str
    ) -> None:
        """
        取消报名

        Args:
            team_id: 团队 ID
            qq_number: QQ 号
        """
        await self.client.request(
            "DELETE",
            f"/api/v2/bot/guilds/{self.client.guild_id}/teams/{team_id}/signups",
            json={"qq_number": qq_number}
        )

    async def get_user_signups(
        self,
        team_id: int,
        qq_number: str
    ) -> List[SignupInfo]:
        """
        查询用户在某个团队的所有报名记录

        Args:
            team_id: 团队 ID
            qq_number: QQ 号

        Returns:
            List[SignupInfo]: 报名列表

        Note:
            此接口需要后端新增支持
        """
        data = await self.client.request(
            "GET",
            f"/api/v2/bot/guilds/{self.client.guild_id}/teams/{team_id}/signups/{qq_number}"
        )
        return [SignupInfo(**signup) for signup in data]
