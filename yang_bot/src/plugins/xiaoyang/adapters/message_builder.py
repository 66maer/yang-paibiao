"""消息构建器 - 负责格式化各种响应消息"""
from typing import List
import base64
from nonebot.adapters.onebot.v11 import Message, MessageSegment
from nonebot import logger
from ..api.models import TeamInfo
from ..services.screenshot_service import screenshot_service


class MessageBuilder:
    """消息构建器"""

    @staticmethod
    def build_teams_list(teams: List[TeamInfo]) -> Message:
        """
        构建团队列表消息

        Args:
            teams: 团队列表

        Returns:
            Message: 格式化的消息
        """
        if not teams:
            return Message("当前没有开放的团队")

        msg_parts = ["当前开放的团队:\n"]
        for idx, team in enumerate(teams, 1):
            # 格式化时间
            time_str = team.team_time.strftime("%m-%d %H:%M")

            # 构建报名信息
            signup_info = f"{team.signup_count}"
            if team.cancelled_count > 0:
                signup_info += f"(-{team.cancelled_count})"
            signup_info += f"/{team.max_members}"

            msg_parts.append(
                f"\n【{idx}】{team.title}\n"
                f"   副本: {team.dungeon}\n"
                f"   时间: {time_str}\n"
                f"   人数: {signup_info}人"
            )

        msg_parts.append("\n\n回复 '查看团队 序号' 查看详情")
        return Message("".join(msg_parts))

    @staticmethod
    async def build_team_detail(team: TeamInfo, index: int, guild_qq_number: str) -> Message:
        """
        构建团队详情消息（图片形式）

        Args:
            team: 团队信息
            index: 团队序号
            guild_qq_number: QQ群号

        Returns:
            Message: 图片消息
        """
        try:
            # 使用截图服务获取团队图片
            logger.info(f"正在生成团队 {team.id} 的截图...")

            # 调用截图服务（使用 QQ 群号，而不是内部 guild_id）
            # 使用后端提供的 latest_change_at 作为缓存时间戳
            # 同时传递报名统计数据，增强缓存key的准确性
            image_bytes = await screenshot_service.capture_team_image(
                guild_id=guild_qq_number,
                team_id=team.id,
                cache_timestamp=team.latest_change_at.isoformat(),
                signup_count=team.signup_count,
                total_signup_count=team.total_signup_count,
            )

            # 将图片转换为 base64
            image_base64 = base64.b64encode(image_bytes).decode()

            # 构建图片消息
            return Message(MessageSegment.image(f"base64://{image_base64}"))

        except Exception as e:
            logger.error(f"生成团队截图失败: {e}")
            # 降级到文本消息
            time_str = team.team_time.strftime("%Y-%m-%d %H:%M")
            return Message(
                f"【团队{index}】详细信息:\n"
                f"标题: {team.title}\n"
                f"副本: {team.dungeon}\n"
                f"时间: {time_str}\n"
                f"人数: {team.max_members}人\n"
                f"状态: {team.status}\n"
                f"\n(图片生成失败，请稍后重试)"
            )

    @staticmethod
    def build_error_message(error_msg: str) -> Message:
        """
        构建错误消息

        Args:
            error_msg: 错误信息

        Returns:
            Message: 格式化的错误消息
        """
        return Message(f"❌ {error_msg}")

    @staticmethod
    def build_success_message(success_msg: str) -> Message:
        """
        构建成功消息

        Args:
            success_msg: 成功信息

        Returns:
            Message: 格式化的成功消息
        """
        return Message(f"✅ {success_msg}")

    @staticmethod
    def build_signup_result_message(
        player_name: str,
        xinfa: str,
        allocation_status: str = None,
        allocated_slot: int = None,
        waitlist_position: int = None,
        is_proxy: bool = False,
        is_rich: bool = False
    ) -> Message:
        """
        构建报名结果消息

        Args:
            player_name: 玩家名称
            xinfa: 心法
            allocation_status: 分配状态 (allocated/waitlist/unallocated)
            allocated_slot: 已分配的坑位索引 (0-24)
            waitlist_position: 候补位置 (0-based)
            is_proxy: 是否代报名
            is_rich: 是否老板

        Returns:
            Message: 格式化的报名结果消息
        """
        # 构建基本信息
        action = "代报名" if is_proxy else "报名"
        role_type = "老板" if is_rich else xinfa
        
        if allocation_status == "allocated":
            # 分配成功
            slot_display = allocated_slot + 1 if allocated_slot is not None else "?"
            return Message(f"✅ {action}成功！\n"
                          f"玩家: {player_name}\n"
                          f"心法: {role_type}\n"
                          f"坑位: 第{slot_display}号")
        elif allocation_status == "waitlist":
            # 进入候补
            position = waitlist_position + 1 if waitlist_position is not None else "?"
            return Message(f"⏳ {action}成功，但进入候补！\n"
                          f"玩家: {player_name}\n"
                          f"心法: {role_type}\n"
                          f"候补位置: 第{position}位\n"
                          f"（当有人取消或规则变更时，可能自动补位）")
        else:
            # 默认成功消息
            return Message(f"✅ {action}成功！\n"
                          f"玩家: {player_name}\n"
                          f"心法: {role_type}")
