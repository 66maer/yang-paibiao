"""群事件处理器 - 处理进群/退群等事件"""
from nonebot import on_notice
from nonebot.adapters.onebot.v11 import (
    Bot,
    GroupIncreaseNoticeEvent,
    GroupDecreaseNoticeEvent
)
from nonebot.log import logger

from ..api.client import get_api_client, APIError
from ..api.models import MemberInfo, MemberBatchRequest


# ==================== 群成员增加事件 ====================
group_increase = on_notice(priority=5, block=False)


@group_increase.handle()
async def handle_member_join(bot: Bot, event: GroupIncreaseNoticeEvent):
    """
    处理群成员增加事件 - 自动同步到后端

    Args:
        bot: Bot 实例
        event: 群成员增加事件
    """
    try:
        # 获取用户信息
        user_info = await bot.get_group_member_info(
            group_id=event.group_id,
            user_id=event.user_id
        )

        qq_number = str(event.user_id)
        nickname = user_info.get("nickname", "")
        group_nickname = user_info.get("card", "")

        logger.info(f"群成员加入: qq={qq_number}, nickname={nickname}, card={group_nickname}")

        # 同步到后端
        api_client = get_api_client()

        member = MemberInfo(
            qq_number=qq_number,
            nickname=nickname,
            group_nickname=group_nickname
        )

        request = MemberBatchRequest(members=[member])
        await api_client.members.add_members_batch(request)

        logger.success(f"成功同步新成员到后端: {qq_number}")

    except APIError as e:
        logger.error(f"同步新成员到后端失败: {e}")

    except Exception as e:
        logger.exception(f"处理群成员加入事件失败: {e}")


# ==================== 群成员减少事件 ====================
group_decrease = on_notice(priority=5, block=False)


@group_decrease.handle()
async def handle_member_leave(bot: Bot, event: GroupDecreaseNoticeEvent):
    """
    处理群成员减少事件 - 自动同步到后端

    Args:
        bot: Bot 实例
        event: 群成员减少事件
    """
    try:
        qq_number = str(event.user_id)

        logger.info(f"群成员离开: qq={qq_number}")

        # 同步到后端
        api_client = get_api_client()
        await api_client.members.remove_members_batch([qq_number])

        logger.success(f"成功从后端移除成员: {qq_number}")

    except APIError as e:
        logger.error(f"从后端移除成员失败: {e}")

    except Exception as e:
        logger.exception(f"处理群成员离开事件失败: {e}")
