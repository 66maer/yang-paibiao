"""NoneBot Matcher 定义和处理函数"""
import re
from nonebot import on_command, on_message, on_keyword
from nonebot.adapters.onebot.v11 import Bot, GroupMessageEvent, Message
from nonebot.params import CommandArg, EventPlainText
from nonebot.log import logger
from nonebot.permission import SUPERUSER
from nonebot.adapters.onebot.v11.permission import GROUP_OWNER
from nonebot.exception import FinishedException, PausedException, RejectedException

from ..api.client import get_api_client, APIError
from ..services.team_service import TeamService
from ..services.signup_service import SignupService, MultipleCharactersError
from ..services.member_service import MemberService
from ..services.session_manager import get_session_manager
from ..services.parser import get_parser
from .message_builder import MessageBuilder


# ==================== 查看团队 ====================
view_teams = on_keyword(
    {"查看团队", "查团", "有团吗", "有车吗"},
    priority=10,
    block=True
)


@view_teams.handle()
async def handle_view_teams(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """
    处理查看团队命令

    支持格式:
    - 查看团队 / 查团 / 有团吗 / 有车吗 - 查看所有团队列表
    - 查看团队 1 / 查团 1 - 查看指定序号的团队详情
    """
    try:
        # 从事件中获取群组 ID
        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        team_service = TeamService(api_client)

        # 获取团队列表
        teams = await team_service.get_teams()

        # 提取参数（去除关键词部分）
        for keyword in ["查看团队", "查团", "有团吗", "有车吗"]:
            if plain_text.startswith(keyword):
                args_text = plain_text[len(keyword):].strip()
                break
        else:
            args_text = ""

        if not args_text:
            # 没有参数
            if len(teams) == 1:
                # 只有一个团队，直接返回团队详情
                team = teams[0]
                msg = await MessageBuilder.build_team_detail(team, 1, str(guild_id))
                await view_teams.finish(msg)
            else:
                # 多个团队，返回团队列表
                msg = MessageBuilder.build_teams_list(teams)
                await view_teams.finish(msg)
        else:
            # 有参数，尝试解析为序号
            try:
                index = int(args_text)
                team = await team_service.get_team_by_index(teams, index)
                # 传递 QQ 群号用于截图服务
                msg = await MessageBuilder.build_team_detail(team, index, str(guild_id))
                await view_teams.finish(msg)
            except ValueError as e:
                msg = MessageBuilder.build_error_message(str(e))
                await view_teams.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        # 让 NoneBot 的控制流异常正常传播
        raise

    except APIError as e:
        logger.error(f"API 错误: {e}")
        msg = MessageBuilder.build_error_message(f"获取团队列表失败: {e}")
        await view_teams.finish(msg)

    except Exception as e:
        logger.exception(f"未知错误: {e}")
        msg = MessageBuilder.build_error_message("系统错误，请联系管理员")
        await view_teams.finish(msg)


# ==================== 修改昵称 ====================
update_nickname = on_keyword(
    {"修改昵称"},
    priority=10,
    block=True
)


@update_nickname.handle()
async def handle_update_nickname(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """
    处理修改昵称命令

    格式: 修改昵称 <新昵称>
    """
    try:
        # 提取新昵称（去除关键词"修改昵称"）
        new_nickname = plain_text.replace("修改昵称", "", 1).strip()

        if not new_nickname:
            msg = MessageBuilder.build_error_message("请提供新昵称，格式：修改昵称 <新昵称>")
            await update_nickname.finish(msg)

        # 获取用户 QQ 号
        qq_number = str(event.user_id)

        # 调用 API 修改昵称
        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        await api_client.members.update_nickname(qq_number, new_nickname)

        msg = MessageBuilder.build_success_message(f"昵称已修改为: {new_nickname}")
        await update_nickname.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        # 让 NoneBot 的控制流异常正常传播
        raise

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
        # 获取 API 客户端（需要在解析前获取，用于构建上下文）
        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        qq_number = str(event.user_id)

        # 构建解析上下文
        parse_context = {
            "user_id": qq_number,
            "group_id": str(guild_id),
            "api_client": api_client,
        }

        # 使用解析器解析消息
        parser = get_parser()
        intent = await parser.parse(plain_text, parse_context)

        # 调试日志：打印 NLP 解析结果
        logger.info(f"[NLP解析] 原始消息: {plain_text}")
        logger.info(f"[NLP解析] 解析结果: {intent}")
        if intent:
            logger.info(f"[NLP解析] 动作: {intent.action}")
            logger.info(f"[NLP解析] 参数: {intent.params}")
            logger.info(f"[NLP解析] 是否需要追问: {intent.need_followup}")

        # 如果无法解析，直接返回，不处理
        if not intent:
            return

        # 如果需要追问用户
        if intent.need_followup and intent.followup_question:
            session_manager = get_session_manager()
            session_manager.create_session(
                user_id=qq_number,
                group_id=str(guild_id),
                action="nlp_followup",
                data={
                    "history": [
                        {"role": "user", "content": plain_text},
                        {"role": "assistant", "content": intent.followup_question},
                    ],
                    "partial_intent": {
                        "action": intent.action,
                        "params": intent.params,
                    }
                }
            )
            await signup_matcher.finish(intent.followup_question)

        # 如果解析错误，提示用户
        if "error" in intent.params:
            msg = MessageBuilder.build_error_message(intent.params["error"])
            await signup_matcher.finish(msg)

        # 使用已获取的 API 客户端
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
            await _handle_cancel_signup(
                signup_matcher,
                event,
                api_client,
                qq_number,
                team.id,
                intent.params
            )

    except (FinishedException, PausedException, RejectedException):
        # 让 NoneBot 的控制流异常正常传播
        raise

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
    try:
        # 获取被代报名的用户名
        proxy_user_name = params.get("proxy_user_name")
        if not proxy_user_name:
            msg = MessageBuilder.build_error_message("请提供被代报名的用户名")
            await matcher.finish(msg)

        # 搜索用户
        member_service = MemberService(api_client)
        try:
            user = await member_service.find_unique_user(proxy_user_name)
        except ValueError as e:
            msg = MessageBuilder.build_error_message(str(e))
            await matcher.finish(msg)

        # 获取被代报名用户的 QQ 号
        proxy_qq_number = user.qq_number

        # 调用报名服务（使用被代报名用户的 QQ 号）
        xinfa = params.get("xinfa")
        character_name = params.get("character_name")
        is_rich = params.get("is_rich", False)

        signup_info = await signup_service.process_signup(
            qq_number=proxy_qq_number,
            team_id=team_id,
            xinfa=xinfa,
            character_name=character_name,
            is_rich=is_rich
        )

        # 构建成功消息
        display_name = user.group_nickname or user.nickname or user.qq_number
        msg = MessageBuilder.build_success_message(
            f"代报名成功！已为 {display_name} 报名\n"
            f"心法: {signup_info.signup_info.get('xinfa', xinfa)}\n"
            f"角色: {signup_info.signup_info.get('character_name', character_name or '待定')}"
        )
        await matcher.finish(msg)

    except MultipleCharactersError as e:
        char_list = "\n".join([f"{i+1}. {c.name} - {c.xinfa} ({c.server})"
                               for i, c in enumerate(e.characters)])
        msg = MessageBuilder.build_error_message(
            f"找到多个角色，请指定完整的角色名:\n{char_list}"
        )
        await matcher.finish(msg)

    except ValueError as e:
        msg = MessageBuilder.build_error_message(str(e))
        await matcher.finish(msg)


async def _handle_register_rich(
    matcher,
    api_client,
    signup_service: SignupService,
    submitter_qq: str,
    team_id: int,
    params: dict
):
    """处理登记老板（逻辑与代报名完全相同，只是 is_rich=True）"""
    try:
        # 获取老板的用户名
        proxy_user_name = params.get("proxy_user_name")
        if not proxy_user_name:
            msg = MessageBuilder.build_error_message("请提供老板的名称")
            await matcher.finish(msg)

        # 搜索用户
        member_service = MemberService(api_client)
        try:
            user = await member_service.find_unique_user(proxy_user_name)
        except ValueError as e:
            msg = MessageBuilder.build_error_message(str(e))
            await matcher.finish(msg)

        # 获取老板的 QQ 号
        rich_qq_number = user.qq_number

        # 调用报名服务（is_rich=True）
        xinfa = params.get("xinfa")
        character_name = params.get("character_name")

        signup_info = await signup_service.process_signup(
            qq_number=rich_qq_number,
            team_id=team_id,
            xinfa=xinfa,
            character_name=character_name,
            is_rich=True  # 老板位
        )

        # 构建成功消息
        display_name = user.group_nickname or user.nickname or user.qq_number
        msg = MessageBuilder.build_success_message(
            f"老板登记成功！已为 {display_name} 登记老板位\n"
            f"心法: {signup_info.signup_info.get('xinfa', xinfa)}\n"
            f"角色: {signup_info.signup_info.get('character_name', character_name or '待定')}"
        )
        await matcher.finish(msg)

    except MultipleCharactersError as e:
        char_list = "\n".join([f"{i+1}. {c.name} - {c.xinfa} ({c.server})"
                               for i, c in enumerate(e.characters)])
        msg = MessageBuilder.build_error_message(
            f"找到多个角色，请指定完整的角色名:\n{char_list}"
        )
        await matcher.finish(msg)

    except ValueError as e:
        msg = MessageBuilder.build_error_message(str(e))
        await matcher.finish(msg)


async def _handle_cancel_signup(
    matcher,
    event: GroupMessageEvent,
    api_client,
    qq_number: str,
    team_id: int,
    params: dict
):
    """处理取消报名"""
    try:
        # 查询用户在该团队的所有报名
        signups = await api_client.signups.get_user_signups(team_id, qq_number)

        if not signups:
            msg = MessageBuilder.build_error_message("你在该团队没有报名记录")
            await matcher.finish(msg)

        # 获取可选的标识符
        identifier = params.get("identifier")

        if len(signups) == 1:
            # 只有一个报名，直接取消
            signup = signups[0]
            await api_client.signups.cancel_signup(team_id, qq_number)

            xinfa = signup.signup_info.get("xinfa", "未知")
            char_name = signup.signup_info.get("character_name", "待定")
            msg = MessageBuilder.build_success_message(
                f"取消报名成功！\n心法: {xinfa}\n角色: {char_name}"
            )
            await matcher.finish(msg)

        else:
            # 多个报名，需要用户选择
            if identifier:
                # 尝试通过标识符匹配（心法名或角色名）
                matched = []
                for signup in signups:
                    xinfa = signup.signup_info.get("xinfa", "")
                    char_name = signup.signup_info.get("character_name", "")

                    if identifier == xinfa or identifier == char_name:
                        matched.append(signup)

                if len(matched) == 1:
                    # 找到唯一匹配，直接取消
                    signup = matched[0]
                    await api_client.signups.cancel_signup(team_id, qq_number)

                    xinfa = signup.signup_info.get("xinfa", "未知")
                    char_name = signup.signup_info.get("character_name", "待定")
                    msg = MessageBuilder.build_success_message(
                        f"取消报名成功！\n心法: {xinfa}\n角色: {char_name}"
                    )
                    await matcher.finish(msg)

                elif len(matched) > 1:
                    # 匹配到多个，仍需选择
                    signups = matched

            # 创建会话，让用户选择
            session_manager = get_session_manager()
            group_id = str(event.group_id)

            session_manager.create_session(
                user_id=qq_number,
                group_id=group_id,
                action="cancel_signup_select",
                data={
                    "team_id": team_id,
                    "signups": [
                        {
                            "id": s.id,
                            "xinfa": s.signup_info.get("xinfa", "未知"),
                            "character_name": s.signup_info.get("character_name", "待定"),
                            "is_rich": s.is_rich
                        }
                        for s in signups
                    ]
                }
            )

            # 构建报名列表消息
            msg_parts = ["你有多个报名，请选择要取消的报名:\n"]
            for idx, signup in enumerate(signups, 1):
                xinfa = signup.signup_info.get("xinfa", "未知")
                char_name = signup.signup_info.get("character_name", "待定")
                rich_tag = " [老板]" if signup.is_rich else ""
                msg_parts.append(f"\n【{idx}】{xinfa} - {char_name}{rich_tag}")

            msg_parts.append("\n\n请回复序号进行取消")
            msg = Message("".join(msg_parts))
            await matcher.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        # 让 NoneBot 的控制流异常正常传播
        raise

    except Exception as e:
        logger.exception(f"取消报名失败: {e}")
        msg = MessageBuilder.build_error_message(f"取消报名失败: {str(e)}")
        await matcher.finish(msg)


# ==================== 会话处理 ====================
# 处理用户在会话中的回复
session_handler = on_message(
    priority=15,  # 优先级高于 signup_matcher
    block=False
)


@session_handler.handle()
async def handle_session_message(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """处理会话中的用户消息"""
    session_manager = get_session_manager()
    qq_number = str(event.user_id)
    group_id = str(event.group_id)

    # 获取当前会话
    session = session_manager.get_session(qq_number, group_id)

    if not session:
        # 没有会话，不处理
        return

    # 根据会话类型处理
    if session.action == "cancel_signup_select":
        await _handle_cancel_signup_select(
            session_handler,
            event,
            session,
            plain_text.strip()
        )
    elif session.action == "nlp_followup":
        await _handle_nlp_followup(
            session_handler,
            event,
            session,
            plain_text.strip()
        )


async def _handle_cancel_signup_select(
    matcher,
    event: GroupMessageEvent,
    session,
    user_input: str
):
    """处理取消报名的选择"""
    try:
        # 尝试解析为数字
        try:
            index = int(user_input)
        except ValueError:
            # 不是数字，忽略
            return

        signups = session.data.get("signups", [])
        team_id = session.data.get("team_id")

        if index < 1 or index > len(signups):
            msg = MessageBuilder.build_error_message(f"无效的序号，请输入 1-{len(signups)} 之间的数字")
            await matcher.send(msg)
            return

        # 获取选择的报名
        selected_signup = signups[index - 1]

        # 调用 API 取消报名
        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        qq_number = str(event.user_id)
        await api_client.signups.cancel_signup(team_id, qq_number)

        # 关闭会话
        session_manager = get_session_manager()
        session_manager.close_session(qq_number, str(event.group_id))

        # 构建成功消息
        xinfa = selected_signup["xinfa"]
        char_name = selected_signup["character_name"]
        msg = MessageBuilder.build_success_message(
            f"取消报名成功！\n心法: {xinfa}\n角色: {char_name}"
        )
        await matcher.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        # 让 NoneBot 的控制流异常正常传播
        raise

    except Exception as e:
        logger.exception(f"处理取消报名选择失败: {e}")
        msg = MessageBuilder.build_error_message(f"取消报名失败: {str(e)}")
        await matcher.finish(msg)


async def _handle_nlp_followup(
    matcher,
    event: GroupMessageEvent,
    session,
    user_input: str
):
    """处理 NLP 多轮对话的追问回复"""
    try:
        qq_number = str(event.user_id)
        guild_id = event.group_id
        session_manager = get_session_manager()

        # 获取历史对话
        history = session.data.get("history", [])

        # 添加用户的回复到历史
        history.append({"role": "user", "content": user_input})

        # 获取 API 客户端
        api_client = get_api_client(guild_id=guild_id)

        # 构建解析上下文
        parse_context = {
            "user_id": qq_number,
            "group_id": str(guild_id),
            "api_client": api_client,
        }

        # 重新调用 NLP 解析器（带历史）
        parser = get_parser()

        # 检查解析器是否支持 history 参数
        if hasattr(parser, 'parse') and 'history' in parser.parse.__code__.co_varnames:
            intent = await parser.parse(user_input, parse_context, history=history)
        else:
            intent = await parser.parse(user_input, parse_context)

        # 调试日志：打印 NLP 多轮对话解析结果
        logger.info(f"[NLP多轮] 用户输入: {user_input}")
        logger.info(f"[NLP多轮] 对话历史: {history}")
        logger.info(f"[NLP多轮] 解析结果: {intent}")
        if intent:
            logger.info(f"[NLP多轮] 动作: {intent.action}")
            logger.info(f"[NLP多轮] 参数: {intent.params}")
            logger.info(f"[NLP多轮] 是否需要追问: {intent.need_followup}")

        # 如果仍无法解析
        if not intent:
            # 保持会话，等待用户继续输入
            return

        # 如果仍需追问
        if intent.need_followup and intent.followup_question:
            # 更新会话历史
            history.append({"role": "assistant", "content": intent.followup_question})
            session_manager.create_session(
                user_id=qq_number,
                group_id=str(guild_id),
                action="nlp_followup",
                data={
                    "history": history,
                    "partial_intent": {
                        "action": intent.action,
                        "params": intent.params,
                    }
                }
            )
            await matcher.finish(intent.followup_question)

        # 关闭会话
        session_manager.close_session(qq_number, str(guild_id))

        # 如果解析错误
        if "error" in intent.params:
            msg = MessageBuilder.build_error_message(intent.params["error"])
            await matcher.finish(msg)

        # 获取团队服务
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
            await matcher.finish(msg)

        # 根据意图类型处理
        if intent.action == "signup":
            await _handle_signup(
                matcher,
                signup_service,
                qq_number,
                team.id,
                intent.params
            )

        elif intent.action == "proxy_signup":
            await _handle_proxy_signup(
                matcher,
                api_client,
                signup_service,
                qq_number,
                team.id,
                intent.params
            )

        elif intent.action == "register_rich":
            await _handle_register_rich(
                matcher,
                api_client,
                signup_service,
                qq_number,
                team.id,
                intent.params
            )

        elif intent.action == "cancel_signup":
            await _handle_cancel_signup(
                matcher,
                event,
                api_client,
                qq_number,
                team.id,
                intent.params
            )

    except (FinishedException, PausedException, RejectedException):
        raise

    except APIError as e:
        logger.error(f"API 错误: {e}")
        msg = MessageBuilder.build_error_message(f"操作失败: {e}")
        await matcher.finish(msg)

    except Exception as e:
        logger.exception(f"处理 NLP 追问失败: {e}")
        # 关闭会话
        session_manager = get_session_manager()
        session_manager.close_session(str(event.user_id), str(event.group_id))
        return


# ==================== 初始化成员（超级管理员或群主专用）====================
init_members = on_keyword(
    {"初始化成员"},
    permission=SUPERUSER | GROUP_OWNER,
    priority=10,
    block=True
)


@init_members.handle()
async def handle_init_members(bot: Bot, event: GroupMessageEvent):
    """
    处理初始化成员命令 - 将当前群的所有成员同步到后端

    仅超级管理员或群主有权限执行此命令

    功能:
    - 获取当前群的所有成员列表
    - 检查每个成员是否已在后端注册
    - 仅添加未注册的成员到后端
    - 返回同步统计信息
    """
    try:
        group_id = event.group_id

        # 发送开始消息
        await init_members.send("正在获取群成员列表，请稍候...")

        # 获取群成员列表
        logger.info(f"开始获取群 {group_id} 的成员列表")
        group_members = await bot.get_group_member_list(group_id=group_id)

        logger.info(f"获取到 {len(group_members)} 个群成员")

        # 调用成员服务同步成员
        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        member_service = MemberService(api_client)

        await init_members.send(f"获取到 {len(group_members)} 个群成员，开始同步到后端...")

        # 同步成员
        result = await member_service.sync_all_members(group_members)

        # 构建成功消息
        msg = MessageBuilder.build_success_message(
            f"成员同步完成！\n"
            f"总成员数: {result['total']}\n"
            f"新增成员: {result['added']}\n"
            f"已存在成员: {result['existed']}"
        )
        await init_members.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        # 让 NoneBot 的控制流异常正常传播
        raise

    except APIError as e:
        logger.error(f"API 错误: {e}")
        msg = MessageBuilder.build_error_message(f"同步成员失败: {e}")
        await init_members.finish(msg)

    except Exception as e:
        logger.exception(f"初始化成员失败: {e}")
        msg = MessageBuilder.build_error_message(f"初始化成员失败: {str(e)}")
        await init_members.finish(msg)
