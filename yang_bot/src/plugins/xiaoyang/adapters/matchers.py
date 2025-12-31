"""NoneBot Matcher 定义和处理函数"""
import re
from nonebot import on_command, on_message
from nonebot.adapters.onebot.v11 import GroupMessageEvent, Message
from nonebot.params import CommandArg, EventPlainText
from nonebot.log import logger

from ..api.client import get_api_client, APIError
from ..services.team_service import TeamService
from ..services.signup_service import SignupService, MultipleCharactersError
from ..services.parser import KeywordParser
from .message_builder import MessageBuilder


# ==================== 查看团队 ====================
view_teams = on_command(
    "查看团队",
    aliases={"查团", "有团吗", "有车吗"},
    priority=10,
    block=True
)


@view_teams.handle()
async def handle_view_teams(event: GroupMessageEvent, args: Message = CommandArg()):
    """
    处理查看团队命令

    支持格式:
    - 查看团队 / 查团 / 有团吗 / 有车吗 - 查看所有团队列表
    - 查看团队 1 / 查团 1 - 查看指定序号的团队详情
    """
    try:
        api_client = get_api_client()
        team_service = TeamService(api_client)

        # 获取团队列表
        teams = await team_service.get_teams()

        # 检查是否有参数（可能是要查看详情）
        args_text = args.extract_plain_text().strip()

        if not args_text:
            # 没有参数，返回团队列表
            msg = MessageBuilder.build_teams_list(teams)
            await view_teams.finish(msg)
        else:
            # 有参数，尝试解析为序号
            try:
                index = int(args_text)
                team = await team_service.get_team_by_index(teams, index)
                msg = MessageBuilder.build_team_detail(team, index)
                await view_teams.finish(msg)
            except ValueError as e:
                msg = MessageBuilder.build_error_message(str(e))
                await view_teams.finish(msg)

    except APIError as e:
        logger.error(f"API 错误: {e}")
        msg = MessageBuilder.build_error_message(f"获取团队列表失败: {e}")
        await view_teams.finish(msg)

    except Exception as e:
        logger.exception(f"未知错误: {e}")
        msg = MessageBuilder.build_error_message("系统错误，请联系管理员")
        await view_teams.finish(msg)


# ==================== 修改昵称 ====================
update_nickname = on_command(
    "修改昵称",
    priority=10,
    block=True
)


@update_nickname.handle()
async def handle_update_nickname(event: GroupMessageEvent, args: Message = CommandArg()):
    """
    处理修改昵称命令

    格式: 修改昵称 <新昵称>
    """
    try:
        # 解析新昵称
        new_nickname = args.extract_plain_text().strip()

        if not new_nickname:
            msg = MessageBuilder.build_error_message("请提供新昵称，格式：修改昵称 <新昵称>")
            await update_nickname.finish(msg)

        # 获取用户 QQ 号
        qq_number = str(event.user_id)

        # 调用 API 修改昵称
        api_client = get_api_client()
        await api_client.members.update_nickname(qq_number, new_nickname)

        msg = MessageBuilder.build_success_message(f"昵称已修改为: {new_nickname}")
        await update_nickname.finish(msg)

    except APIError as e:
        logger.error(f"API 错误: {e}")
        msg = MessageBuilder.build_error_message(f"修改昵称失败: {e}")
        await update_nickname.finish(msg)

    except Exception as e:
        logger.exception(f"未知错误: {e}")
        msg = MessageBuilder.build_error_message("系统错误，请联系管理员")
        await update_nickname.finish(msg)


# ==================== 报名/代报名/登记老板/取消报名 ====================
# 使用 on_message 捕获消息，通过解析器判断意图
signup_matcher = on_message(
    priority=20,  # 优先级低于命令，避免拦截其他命令
    block=False   # 不阻断，让其他 matcher 也有机会处理
)


@signup_matcher.handle()
async def handle_signup_message(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """
    处理报名相关的消息

    支持:
    - 报名 [序号] [心法/角色名]
    - 代报名 [序号] [用户名] [心法/角色名]
    - 登记老板 [序号] [用户名] [心法/角色名]
    - 取消报名 [序号] [可选标识符]
    """
    try:
        # 使用解析器解析消息
        parser = KeywordParser()
        intent = await parser.parse(plain_text, {})

        # 如果无法解析，直接返回，不处理
        if not intent:
            return

        # 如果解析错误，提示用户
        if "error" in intent.params:
            msg = MessageBuilder.build_error_message(intent.params["error"])
            await signup_matcher.finish(msg)

        # 获取 API 客户端
        api_client = get_api_client()
        team_service = TeamService(api_client)
        signup_service = SignupService(api_client)

        # 获取团队列表
        teams = await team_service.get_teams()

        # 根据序号获取团队
        team_index = intent.params.get("team_index")
        try:
            team = await team_service.get_team_by_index(teams, team_index)
        except ValueError as e:
            msg = MessageBuilder.build_error_message(str(e))
            await signup_matcher.finish(msg)

        # 获取用户 QQ 号
        qq_number = str(event.user_id)

        # ==================== 处理报名 ====================
        if intent.action == "signup":
            await _handle_signup(
                signup_matcher,
                signup_service,
                qq_number,
                team.id,
                intent.params
            )

        # ==================== 处理代报名 ====================
        elif intent.action == "proxy_signup":
            await _handle_proxy_signup(
                signup_matcher,
                api_client,
                signup_service,
                qq_number,
                team.id,
                intent.params
            )

        # ==================== 处理登记老板 ====================
        elif intent.action == "register_rich":
            await _handle_register_rich(
                signup_matcher,
                api_client,
                signup_service,
                qq_number,
                team.id,
                intent.params
            )

        # ==================== 处理取消报名 ====================
        elif intent.action == "cancel_signup":
            # 取消报名逻辑暂时简化处理
            msg = MessageBuilder.build_error_message("取消报名功能开发中...")
            await signup_matcher.finish(msg)

    except APIError as e:
        logger.error(f"API 错误: {e}")
        msg = MessageBuilder.build_error_message(f"操作失败: {e}")
        await signup_matcher.finish(msg)

    except Exception as e:
        logger.exception(f"未知错误: {e}")
        # 这里不finish，让消息继续传递
        return


async def _handle_signup(
    matcher,
    signup_service: SignupService,
    qq_number: str,
    team_id: int,
    params: dict
):
    """处理报名"""
    try:
        mode = params.get("mode")
        xinfa = params.get("xinfa")
        character_name = params.get("character_name")
        is_rich = params.get("is_rich", False)

        # 调用报名服务
        signup_info = await signup_service.process_signup(
            qq_number=qq_number,
            team_id=team_id,
            xinfa=xinfa,
            character_name=character_name,
            is_rich=is_rich
        )

        # 构建成功消息
        msg = MessageBuilder.build_success_message(
            f"报名成功！\n"
            f"心法: {signup_info.signup_info.get('xinfa', xinfa)}\n"
            f"角色: {signup_info.signup_info.get('character_name', character_name or '待定')}"
        )
        await matcher.finish(msg)

    except MultipleCharactersError as e:
        # 多个角色匹配，需要用户选择（暂时简化处理）
        char_list = "\n".join([f"{i+1}. {c.name} - {c.xinfa} ({c.server})"
                               for i, c in enumerate(e.characters)])
        msg = MessageBuilder.build_error_message(
            f"找到多个角色，请指定完整的角色名:\n{char_list}"
        )
        await matcher.finish(msg)

    except ValueError as e:
        msg = MessageBuilder.build_error_message(str(e))
        await matcher.finish(msg)


async def _handle_proxy_signup(
    matcher,
    api_client,
    signup_service: SignupService,
    submitter_qq: str,
    team_id: int,
    params: dict
):
    """处理代报名"""
    # 代报名功能需要后端支持通过昵称查询用户
    # 暂时返回提示
    msg = MessageBuilder.build_error_message(
        "代报名功能需要后端支持，请先完成后端接口开发"
    )
    await matcher.finish(msg)


async def _handle_register_rich(
    matcher,
    api_client,
    signup_service: SignupService,
    submitter_qq: str,
    team_id: int,
    params: dict
):
    """处理登记老板"""
    # 登记老板功能需要后端支持通过昵称查询用户
    # 暂时返回提示
    msg = MessageBuilder.build_error_message(
        "登记老板功能需要后端支持，请先完成后端接口开发"
    )
    await matcher.finish(msg)
