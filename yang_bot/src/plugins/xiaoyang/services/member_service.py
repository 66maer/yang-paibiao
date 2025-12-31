"""成员管理业务逻辑服务"""
from typing import List, Optional, Dict, Any
from nonebot.log import logger

from ..api.client import APIClient
from ..api.models import UserSearchResult, MemberInfo, MemberBatchRequest


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

    async def sync_all_members(
        self,
        group_members: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """
        同步所有群成员到后端

        Args:
            group_members: 群成员信息列表，每个成员包含 user_id, nickname, card 等字段

        Returns:
            Dict[str, int]: 同步结果统计，包含 total, added, existed 三个字段
        """
        logger.info(f"开始同步 {len(group_members)} 个群成员到后端")

        # 统计信息
        total = len(group_members)
        added = 0
        existed = 0

        # 准备要添加的成员列表
        members_to_add = []

        for member in group_members:
            qq_number = str(member.get("user_id"))
            nickname = member.get("nickname", "")
            group_nickname = member.get("card", "")

            # 尝试搜索该用户是否已存在
            try:
                existing_users = await self.search_user_by_nickname(qq_number)

                # 检查是否有完全匹配的 QQ 号
                user_exists = any(u.qq_number == qq_number for u in existing_users)

                if user_exists:
                    logger.info(f"成员已存在: {qq_number} ({nickname})")
                    existed += 1
                else:
                    # 不存在，加入待添加列表
                    members_to_add.append(
                        MemberInfo(
                            qq_number=qq_number,
                            nickname=nickname,
                            group_nickname=group_nickname
                        )
                    )
            except Exception as e:
                # 搜索失败，假设不存在，加入待添加列表
                logger.warning(f"搜索成员 {qq_number} 时出错: {e}，将尝试添加")
                members_to_add.append(
                    MemberInfo(
                        qq_number=qq_number,
                        nickname=nickname,
                        group_nickname=group_nickname
                    )
                )

        # 批量添加新成员
        if members_to_add:
            try:
                request = MemberBatchRequest(members=members_to_add)
                await self.api_client.members.add_members_batch(request)
                added = len(members_to_add)
                logger.success(f"成功添加 {added} 个新成员")
            except Exception as e:
                logger.error(f"批量添加成员失败: {e}")
                raise

        logger.success(f"成员同步完成: 总计 {total}，新增 {added}，已存在 {existed}")

        return {
            "total": total,
            "added": added,
            "existed": existed
        }
