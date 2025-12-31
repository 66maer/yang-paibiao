"""消息构建器 - 负责格式化各种响应消息"""
from typing import List
from nonebot.adapters.onebot.v11 import Message
from ..api.models import TeamInfo


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

            msg_parts.append(
                f"\n【{idx}】{team.title}\n"
                f"   副本: {team.dungeon}\n"
                f"   时间: {time_str}\n"
                f"   人数: {team.max_members}人"
            )

        msg_parts.append("\n\n回复 '查看团队 序号' 查看详情")
        return Message("".join(msg_parts))

    @staticmethod
    def build_team_detail(team: TeamInfo, index: int) -> Message:
        """
        构建团队详情消息（暂时返回文本，后续改为图片）

        Args:
            team: 团队信息
            index: 团队序号

        Returns:
            Message: 格式化的消息
        """
        time_str = team.team_time.strftime("%Y-%m-%d %H:%M")

        return Message(
            f"【团队{index}】详细信息:\n"
            f"标题: {team.title}\n"
            f"副本: {team.dungeon}\n"
            f"时间: {time_str}\n"
            f"人数: {team.max_members}人\n"
            f"状态: {team.status}\n"
            f"\n(图片展示功能开发中...)"
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
