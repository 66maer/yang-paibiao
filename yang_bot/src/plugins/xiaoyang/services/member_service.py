"""成员管理业务逻辑服务"""
from typing import List, Optional
from nonebot.log import logger

from ..api.client import APIClient
from ..api.models import UserSearchResult


class MemberService:
    """成员管理业务逻辑服务"""

    def __init__(self, api_client: APIClient):
        self.api_client = api_client

    async def search_user_by_nickname(
        self,
        nickname: str
    ) -> List[UserSearchResult]:
        """
        通过昵称搜索用户

        Args:
            nickname: 昵称（支持模糊匹配）

        Returns:
            List[UserSearchResult]: 搜索结果列表
        """
        logger.info(f"搜索用户: {nickname}")
        return await self.api_client.members.search_user_by_nickname(nickname)

    async def find_unique_user(
        self,
        nickname: str
    ) -> Optional[UserSearchResult]:
        """
        查找唯一匹配的用户

        Args:
            nickname: 昵称

        Returns:
            Optional[UserSearchResult]: 如果找到唯一用户返回用户信息，否则返回 None

        Raises:
            ValueError: 如果找到多个用户或没有找到用户
        """
        users = await self.search_user_by_nickname(nickname)

        if not users:
            raise ValueError(f"未找到用户: {nickname}")

        if len(users) > 1:
            # 多个用户匹配
            user_list = "\n".join([
                f"  - {u.nickname or u.qq_number} (QQ: {u.qq_number})"
                for u in users
            ])
            raise ValueError(f"找到多个匹配的用户，请提供更精确的名称:\n{user_list}")

        return users[0]
