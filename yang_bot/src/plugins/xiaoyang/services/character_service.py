"""角色管理业务逻辑服务"""
from typing import List, Optional
from ..api.client import APIClient
from ..api.models import CharacterInfo, CharacterCreateRequest
from ..data.xinfa import xinfa_matches, get_xinfa_key


class CharacterService:
    """角色管理业务逻辑服务"""

    def __init__(self, api_client: APIClient):
        self.api_client = api_client

    async def get_user_characters(self, qq_number: str) -> List[CharacterInfo]:
        """
        获取用户的角色列表（按优先级排序）

        Args:
            qq_number: QQ 号

        Returns:
            List[CharacterInfo]: 角色列表（优先级从高到低）
        """
        characters = await self.api_client.characters.get_user_characters(qq_number)

        # 按优先级排序（优先级数字越小越高，None 视为最低优先级）
        def get_priority(char: CharacterInfo) -> int:
            if char.priority is None:
                return 999999  # 最低优先级
            return char.priority

        characters.sort(key=get_priority)

        return characters

    async def find_character_by_name(
        self,
        qq_number: str,
        character_name: str
    ) -> Optional[CharacterInfo]:
        """
        通过角色名查找用户的角色

        Args:
            qq_number: QQ 号
            character_name: 角色名

        Returns:
            Optional[CharacterInfo]: 角色信息，如果找不到返回 None
        """
        characters = await self.get_user_characters(qq_number)

        for char in characters:
            if char.name == character_name:
                return char

        return None

    async def find_characters_by_xinfa(
        self,
        qq_number: str,
        xinfa: str
    ) -> List[CharacterInfo]:
        """
        通过心法查找用户的角色列表

        Args:
            qq_number: QQ 号
            xinfa: 心法名（可以是英文key、中文名或昵称）

        Returns:
            List[CharacterInfo]: 符合条件的角色列表（按优先级排序）
        """
        characters = await self.get_user_characters(qq_number)

        # 筛选出指定心法的角色（使用xinfa_matches进行匹配）
        xinfa_chars = [char for char in characters if xinfa_matches(char.xinfa, xinfa)]

        return xinfa_chars

    async def get_best_character_by_xinfa(
        self,
        qq_number: str,
        xinfa: str,
        dungeon: Optional[str] = None
    ) -> Optional[CharacterInfo]:
        """
        获取用户指定心法的最优先角色
        如果提供了dungeon，会将已清CD的角色优先级降低

        Args:
            qq_number: QQ 号
            xinfa: 心法名（可以是英文key、中文名或昵称）
            dungeon: 副本名称（可选，用于检查CD状态）

        Returns:
            Optional[CharacterInfo]: 最优先的角色，如果没有返回 None
        """
        xinfa_chars = await self.find_characters_by_xinfa(qq_number, xinfa)

        if not xinfa_chars:
            return None

        # 如果提供了副本名称，将已清CD的角色排到后面
        if dungeon:
            # 分离已清CD和未清CD的角色
            available_chars = []
            cd_cleared_chars = []
            for char in xinfa_chars:
                if char.cd_status and char.cd_status.get(dungeon):
                    cd_cleared_chars.append(char)
                else:
                    available_chars.append(char)
            # 优先返回未清CD的角色
            if available_chars:
                return available_chars[0]
            # 如果都清了CD，返回第一个
            return cd_cleared_chars[0] if cd_cleared_chars else None
        
        return xinfa_chars[0]  # 已按优先级排序，第一个就是最优先的

    async def get_character_cd_status(
        self,
        character: CharacterInfo,
        dungeon: str
    ) -> bool:
        """
        检查角色是否已清指定副本的CD

        Args:
            character: 角色信息
            dungeon: 副本名称

        Returns:
            bool: 是否已清CD
        """
        if not character.cd_status:
            return False
        return character.cd_status.get(dungeon, False)

        return None

    async def create_character(
        self,
        qq_number: str,
        name: str,
        xinfa: str,
        server: Optional[str] = None,
        relation_type: str = "owner"
    ) -> CharacterInfo:
        """
        创建角色

        Args:
            qq_number: QQ 号
            name: 角色名
            xinfa: 心法名（标准名称）
            server: 服务器名（可选，后端会自动使用群组服务器）
            relation_type: 关系类型，默认为 "owner"

        Returns:
            CharacterInfo: 创建的角色信息
        """
        # 转换心法名称为英文key
        xinfa_key = get_xinfa_key(xinfa)
        if not xinfa_key:
            raise ValueError(f"无效的心法名称: {xinfa}")

        request = CharacterCreateRequest(
            qq_number=qq_number,
            name=name,
            xinfa=xinfa_key,
            server=server,
            relation_type=relation_type
        )

        return await self.api_client.characters.create_character(request)

    async def character_exists(
        self,
        qq_number: str,
        character_name: str
    ) -> bool:
        """
        检查角色是否存在

        Args:
            qq_number: QQ 号
            character_name: 角色名

        Returns:
            bool: 角色是否存在
        """
        character = await self.find_character_by_name(qq_number, character_name)
        return character is not None
