"""角色相关 API"""
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..client import APIClient

from ..models import CharacterInfo, CharacterCreateRequest


class CharactersEndpoint:
    """角色相关 API 端点"""

    def __init__(self, client: "APIClient"):
        self.client = client

    async def get_user_characters(self, qq_number: str) -> List[CharacterInfo]:
        """
        获取用户的角色列表

        Args:
            qq_number: QQ 号

        Returns:
            List[CharacterInfo]: 角色列表
        """
        data = await self.client.request(
            "GET",
            f"/api/v2/bot/guilds/{self.client.guild_id}/characters/{qq_number}"
        )
        return [CharacterInfo(**char) for char in data]

    async def create_character(
        self,
        request: CharacterCreateRequest
    ) -> CharacterInfo:
        """
        创建角色

        Args:
            request: 创建角色请求

        Returns:
            CharacterInfo: 角色信息

        Note:
            server 字段可选，如果不提供，后端会自动使用群组关联的服务器
        """
        data = await self.client.request(
            "POST",
            f"/api/v2/bot/guilds/{self.client.guild_id}/characters",
            json=request.model_dump(exclude_none=True)
        )
        return CharacterInfo(**data)
