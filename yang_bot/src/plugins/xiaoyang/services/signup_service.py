"""报名业务逻辑服务"""
from typing import Optional, List
from nonebot.log import logger

from ..api.client import APIClient, APIError
from ..api.models import SignupRequest, SignupInfo, CharacterInfo
from .character_service import CharacterService


class MultipleCharactersError(Exception):
    """多个角色匹配错误"""
    def __init__(self, characters: List[CharacterInfo]):
        self.characters = characters
        super().__init__("找到多个匹配的角色")


class SignupService:
    """报名业务逻辑服务"""

    def __init__(self, api_client: APIClient):
        self.api_client = api_client
        self.character_service = CharacterService(api_client)

    async def process_signup(
        self,
        qq_number: str,
        team_id: int,
        xinfa: Optional[str] = None,
        character_name: Optional[str] = None,
        is_rich: bool = False
    ) -> SignupInfo:
        """
        处理报名逻辑

        场景1: 只提供心法
            - 查询用户角色列表
            - 如果有该心法的角色，优先使用
            - 否则模糊报名

        场景2: 只提供角色名
            - 查询该角色，获取心法
            - 使用角色ID报名

        场景3: 提供心法+角色名
            - 先查询角色是否存在
            - 存在: 使用角色ID报名
            - 不存在: 自动创建角色

        Args:
            qq_number: QQ 号
            team_id: 团队 ID
            xinfa: 心法名（可选，标准名称）
            character_name: 角色名（可选）
            is_rich: 是否老板位

        Returns:
            SignupInfo: 报名信息

        Raises:
            ValueError: 参数错误
            MultipleCharactersError: 多个角色匹配
            APIError: API 错误
        """
        logger.info(
            f"处理报名: qq={qq_number}, team={team_id}, "
            f"xinfa={xinfa}, character={character_name}, is_rich={is_rich}"
        )

        # 场景2: 只有角色名
        if character_name and not xinfa:
            return await self._signup_by_character_name(
                qq_number, team_id, character_name, is_rich
            )

        # 场景1: 只有心法
        if xinfa and not character_name:
            return await self._signup_by_xinfa(
                qq_number, team_id, xinfa, is_rich
            )

        # 场景3: 心法+角色名
        if xinfa and character_name:
            return await self._signup_with_xinfa_and_character(
                qq_number, team_id, xinfa, character_name, is_rich
            )

        raise ValueError("必须提供心法或角色名")

    async def _signup_by_character_name(
        self,
        qq_number: str,
        team_id: int,
        character_name: str,
        is_rich: bool
    ) -> SignupInfo:
        """
        通过角色名报名

        Args:
            qq_number: QQ 号
            team_id: 团队 ID
            character_name: 角色名
            is_rich: 是否老板位

        Returns:
            SignupInfo: 报名信息

        Raises:
            ValueError: 找不到角色
            MultipleCharactersError: 多个同名角色
        """
        logger.info(f"通过角色名报名: {character_name}")

        # 查询用户的角色列表
        characters = await self.character_service.get_user_characters(qq_number)

        # 查找匹配的角色
        matched = [c for c in characters if c.name == character_name]

        if not matched:
            raise ValueError(f"未找到角色: {character_name}")

        if len(matched) > 1:
            # 多个同名角色，需要用户选择
            raise MultipleCharactersError(matched)

        character = matched[0]

        # 使用角色ID报名
        request = SignupRequest(
            qq_number=qq_number,
            character_id=character.id,
            xinfa=character.xinfa,
            is_rich=is_rich
        )

        logger.info(f"使用角色ID报名: character_id={character.id}")
        return await self.api_client.signups.create_signup(team_id, request)

    async def _signup_by_xinfa(
        self,
        qq_number: str,
        team_id: int,
        xinfa: str,
        is_rich: bool
    ) -> SignupInfo:
        """
        通过心法报名（优先使用已有角色，否则模糊报名）

        Args:
            qq_number: QQ 号
            team_id: 团队 ID
            xinfa: 心法名（标准名称）
            is_rich: 是否老板位

        Returns:
            SignupInfo: 报名信息
        """
        logger.info(f"通过心法报名: {xinfa}")

        # 查找该心法的最优先角色
        character = await self.character_service.get_best_character_by_xinfa(
            qq_number, xinfa
        )

        if character:
            # 有角色，使用角色ID报名
            request = SignupRequest(
                qq_number=qq_number,
                character_id=character.id,
                xinfa=xinfa,
                is_rich=is_rich
            )
            logger.info(f"使用已有角色报名: character_id={character.id}, name={character.name}")
        else:
            # 没有角色，模糊报名
            request = SignupRequest(
                qq_number=qq_number,
                character_id=None,
                character_name=None,  # 模糊报名不提供角色名
                xinfa=xinfa,
                is_rich=is_rich
            )
            logger.info(f"模糊报名: 无角色ID")

        return await self.api_client.signups.create_signup(team_id, request)

    async def _signup_with_xinfa_and_character(
        self,
        qq_number: str,
        team_id: int,
        xinfa: str,
        character_name: str,
        is_rich: bool
    ) -> SignupInfo:
        """
        使用心法+角色名报名（角色不存在时自动创建）

        Args:
            qq_number: QQ 号
            team_id: 团队 ID
            xinfa: 心法名（标准名称）
            character_name: 角色名
            is_rich: 是否老板位

        Returns:
            SignupInfo: 报名信息
        """
        logger.info(f"使用心法+角色名报名: xinfa={xinfa}, character={character_name}")

        # 查找角色
        character = await self.character_service.find_character_by_name(
            qq_number, character_name
        )

        if character:
            # 角色存在，使用角色ID报名
            request = SignupRequest(
                qq_number=qq_number,
                character_id=character.id,
                xinfa=character.xinfa,  # 使用角色本身的心法，忽略用户提供的心法
                is_rich=is_rich
            )
            logger.info(f"使用已有角色报名: character_id={character.id}")

        else:
            # 角色不存在，先创建角色
            logger.info(f"角色不存在，正在创建: name={character_name}, xinfa={xinfa}")

            try:
                new_character = await self.character_service.create_character(
                    qq_number=qq_number,
                    name=character_name,
                    xinfa=xinfa,
                    server=None  # 后端会自动使用群组服务器
                )
                logger.info(f"角色创建成功: character_id={new_character.id}")

                # 使用新角色报名
                request = SignupRequest(
                    qq_number=qq_number,
                    character_id=new_character.id,
                    xinfa=xinfa,
                    is_rich=is_rich
                )

            except APIError as e:
                # 创建角色失败，使用模糊报名
                logger.warning(f"创建角色失败，使用模糊报名: {e}")
                request = SignupRequest(
                    qq_number=qq_number,
                    character_id=None,
                    character_name=character_name,
                    xinfa=xinfa,
                    is_rich=is_rich
                )

        return await self.api_client.signups.create_signup(team_id, request)
