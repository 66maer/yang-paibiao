"""成员管理业务逻辑服务"""
import re
from typing import List, Optional, Dict, Any
from nonebot.log import logger

from ..api.client import APIClient
from ..api.models import UserSearchResult, MemberInfo, MemberBatchRequest


def clean_and_truncate_nickname(nickname: str, fallback: str = "", max_length: int = 6) -> str:
    """
    清理和截断昵称

    处理逻辑：
    1. 移除特殊字符和表情符号（只保留中文、英文字母、数字）
    2. 截断到指定长度
    3. 如果清理后为空，使用fallback

    Args:
        nickname: 原始昵称
        fallback: 如果清理后为空，使用的后备值
        max_length: 最大长度，默认6个字符

    Returns:
        str: 清理和截断后的昵称
    """
    if not nickname:
        return fallback[:max_length] if fallback else ""

    # 去除首尾空格
    nickname = nickname.strip()

    # 只保留中文、英文字母、数字（移除特殊字符和emoji）
    # \u4e00-\u9fff 是中文汉字的 Unicode 范围
    cleaned = re.sub(r'[^\u4e00-\u9fffa-zA-Z0-9]', '', nickname)

    # 如果清理后为空，使用fallback
    if not cleaned:
        cleaned = fallback[:max_length] if fallback else ""

    # 截断到最大长度
    return cleaned[:max_length]


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
        added = 0  # 新增成员数（包括 created_and_added, added, re_added）
        existed = 0  # 已存在成员数（already_member）
        failed = 0  # 失败数

        # 准备所有成员列表
        all_members = []
        for member in group_members:
            qq_number = str(member.get("user_id"))
            raw_nickname = member.get("nickname", "")
            raw_group_nickname = member.get("card", "")

            # 清理和截断nickname（如果为空使用QQ号作为后备）
            nickname = clean_and_truncate_nickname(raw_nickname, fallback=qq_number)

            # 清理和截断group_nickname（如果为空使用处理后的nickname）
            group_nickname = clean_and_truncate_nickname(raw_group_nickname, fallback=nickname)

            all_members.append(
                MemberInfo(
                    qq_number=qq_number,
                    nickname=nickname,
                    group_nickname=group_nickname
                )
            )

        # 分批处理（每批最多 100 个）
        batch_size = 100
        for i in range(0, len(all_members), batch_size):
            batch = all_members[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(all_members) + batch_size - 1) // batch_size

            logger.info(f"处理第 {batch_num}/{total_batches} 批，共 {len(batch)} 个成员")

            try:
                request = MemberBatchRequest(members=batch)
                result = await self.api_client.members.add_members_batch(request)

                # 统计结果
                for member_result in result.get("results", []):
                    status = member_result.get("status")
                    if status == "already_member":
                        existed += 1
                    elif status in ["created_and_added", "added", "re_added"]:
                        added += 1
                    elif status == "error":
                        failed += 1
                        logger.warning(
                            f"成员 {member_result.get('qq_number')} 添加失败: "
                            f"{member_result.get('message')}"
                        )

                logger.success(
                    f"第 {batch_num} 批处理完成: "
                    f"成功 {result.get('success_count', 0)}, "
                    f"失败 {result.get('failed_count', 0)}"
                )

            except Exception as e:
                logger.error(f"第 {batch_num} 批处理失败: {e}")
                failed += len(batch)

        logger.success(
            f"成员同步完成: 总计 {total}，新增 {added}，已存在 {existed}"
            + (f"，失败 {failed}" if failed > 0 else "")
        )

        return {
            "total": total,
            "added": added,
            "existed": existed,
            "failed": failed
        }
