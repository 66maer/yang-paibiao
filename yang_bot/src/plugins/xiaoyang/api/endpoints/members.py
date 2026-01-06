"""成员相关 API"""
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..client import APIClient

from ..models import MemberBatchRequest, UserSearchResult, UpdateNicknameRequest


class MembersEndpoint:
    """成员相关 API 端点"""

    def __init__(self, client: "APIClient"):
        self.client = client

    async def add_members_batch(self, request: MemberBatchRequest) -> dict:
        """
        批量添加成员

        Args:
            request: 批量添加成员请求

        Returns:
            dict: 添加结果
        """
        data = await self.client.request(
            "POST",
            f"/api/v2/bot/guilds/{self.client.guild_id}/members/batch",
            json=request.model_dump()
        )
        return data

    async def remove_members_batch(self, qq_numbers: List[str]) -> dict:
        """
        批量移除成员

        Args:
            qq_numbers: QQ 号列表

        Returns:
            dict: 移除结果
        """
        data = await self.client.request(
            "POST",
            f"/api/v2/bot/guilds/{self.client.guild_id}/members/batch-remove",
            json={"qq_numbers": qq_numbers}
        )
        return data

    async def update_nickname(
        self,
        qq_number: str,
        new_nickname: str
    ) -> None:
        """
        修改群昵称

        Args:
            qq_number: QQ 号
            new_nickname: 新昵称
        """
        await self.client.request(
            "PUT",
            f"/api/v2/bot/guilds/{self.client.guild_id}/members/{qq_number}/nickname",
            json={"group_nickname": new_nickname}
        )

    async def search_user_by_nickname(
        self,
        nickname: str
    ) -> List[UserSearchResult]:
        """
        通过昵称搜索用户

        Args:
            nickname: 昵称（支持模糊匹配）

        Returns:
            List[UserSearchResult]: 用户搜索结果列表

        Note:
            此接口需要后端新增支持
        """
        data = await self.client.request(
            "GET",
            f"/api/v2/bot/guilds/{self.client.guild_id}/members/search",
            params={"nickname": nickname}
        )
        # data 是一个字典，包含 members 键
        members = data.get("members", [])
        return [UserSearchResult(**user) for user in members]
