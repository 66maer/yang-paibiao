"""NoneBot Matcher 定义和处理函数（重构版）

处理流程：
1. 关键词过滤（使用 NoneBot 的 on_keyword）
2. 二次过滤（排除询问类消息、正在进行会话的消息）
3. 预查询数据（用户角色列表、当前报名信息）
4. NLP 解析意图
5. 根据意图分别处理

意图模式：
- signup: 自己报名
- proxy_signup: 代他人报名
- register_rich: 登记老板
- cancel_signup: 取消报名
"""
import re
from nonebot import on_command, on_message, on_keyword
from nonebot.adapters.onebot.v11 import Bot, GroupMessageEvent, Message
from nonebot.params import CommandArg, EventPlainText
from nonebot.log import logger
from nonebot.permission import SUPERUSER
from nonebot.adapters.onebot.v11.permission import GROUP_OWNER
from nonebot.exception import FinishedException, PausedException, RejectedException
from typing import Optional, List, Dict, Any

from ..api.client import get_api_client, APIError
from ..services.team_service import TeamService
from ..services.member_service import MemberService
from ..services.session_manager import get_session_manager
from ..services.parser import get_parser
from .message_builder import MessageBuilder
from ..data.xinfa import normalize_xinfa_name, get_xinfa_key, XINFA_INFO


# ==================== 辅助函数 ====================

def format_xinfa_display(xinfa: str) -> str:
    """
    格式化心法名用于输出显示
    
    Args:
        xinfa: 心法名（可能是英文key、中文标准名或昵称）
    
    Returns:
        str: 标准的中文心法名
    """
    if not xinfa:
        return "未知"
    
    # 如果是英文 key，转换为中文名
    if xinfa in XINFA_INFO:
        return XINFA_INFO[xinfa]["name"]
    
    # 尝试标准化心法名
    normalized = normalize_xinfa_name(xinfa)
    return normalized if normalized != xinfa or not xinfa else xinfa


# 排除的询问类正则模式
EXCLUDE_PATTERNS = [
    r"有.*吗[？?]?$",
    r"还有.*吗[？?]?$",
    r".*多少.*[？?]$",
    r"什么时候",
    r"几点",
    r"谁.*报名",
    r"不要.*取消",
    r"别.*取消",
]


def is_question_or_statement(text: str) -> bool:
    """判断消息是否是询问类或陈述类（非命令式）"""
    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, text):
            return True
    return False


async def pre_query_context(api_client, qq_number: str, guild_id: int) -> Dict[str, Any]:
    """
    预查询相关数据
    
    Args:
        api_client: API 客户端
        qq_number: 用户 QQ 号
        guild_id: 群组 ID
    
    Returns:
        包含团队列表、用户角色列表、用户报名信息的字典
    """
    context = {
        "teams": [],
        "user_characters": [],
        "user_signups": [],  # 用户相关的所有报名（自己报的或被代报的）
    }
    
    try:
        # 获取团队列表
        teams = await api_client.teams.get_teams()
        context["teams"] = [
            {
                "index": idx + 1,
                "id": team.id,
                "title": team.title,
                "time": team.team_time.strftime("%Y-%m-%d %H:%M") if team.team_time else None,
                "dungeon": team.dungeon,
                "signup_count": team.signup_count,
            }
            for idx, team in enumerate(teams)
        ]
        
        # 获取用户角色列表（用于 signup 意图时匹配角色）
        try:
            characters = await api_client.characters.get_user_characters(qq_number)
            context["user_characters"] = [
                {
                    "id": char.id,
                    "name": char.name,
                    "xinfa": char.xinfa,
                    "priority": char.priority,
                }
                for char in characters
            ]
        except Exception as e:
            logger.debug(f"获取用户角色列表失败: {e}")
        
        # 获取用户在各个团队的报名信息
        # 包括：自己给自己报的、自己给别人代报的、别人给自己代报的
        for idx, team in enumerate(teams):
            try:
                signups = await api_client.signups.get_user_signups(team.id, qq_number)
                for signup in signups:
                    context["user_signups"].append({
                        "signup_id": signup.id,
                        "team_index": idx + 1,
                        "team_id": team.id,
                        "xinfa": signup.signup_info.get("xinfa", ""),
                        "character_name": signup.signup_info.get("character_name", ""),
                        "player_name": signup.signup_info.get("player_name", ""),
                        "player_qq_number": signup.signup_info.get("player_qq_number"),  # 用于判断是否是自己的报名
                        "is_rich": signup.is_rich,
                        "submitter_id": signup.submitter_id,
                        "signup_user_id": signup.signup_user_id,
                    })
            except Exception as e:
                logger.debug(f"获取团队 {team.id} 报名状态失败: {e}")
    
    except Exception as e:
        logger.error(f"预查询上下文失败: {e}")
    
    return context


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
        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        team_service = TeamService(api_client)

        teams = await team_service.get_teams()

        # 提取参数（去除关键词部分）
        for keyword in ["查看团队", "查团", "有团吗", "有车吗"]:
            if plain_text.startswith(keyword):
                args_text = plain_text[len(keyword):].strip()
                break
        else:
            args_text = ""

        if not args_text:
            if len(teams) == 1:
                team = teams[0]
                msg = await MessageBuilder.build_team_detail(team, 1, str(guild_id))
                await view_teams.finish(msg)
            else:
                msg = MessageBuilder.build_teams_list(teams)
                await view_teams.finish(msg)
        else:
            try:
                index = int(args_text)
                team = await team_service.get_team_by_index(teams, index)
                msg = await MessageBuilder.build_team_detail(team, index, str(guild_id))
                await view_teams.finish(msg)
            except ValueError as e:
                msg = MessageBuilder.build_error_message(str(e))
                await view_teams.finish(msg)

    except (FinishedException, PausedException, RejectedException):
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
    """处理修改昵称命令"""
    try:
        new_nickname = plain_text.replace("修改昵称", "", 1).strip()

        if not new_nickname:
            msg = MessageBuilder.build_error_message("请提供新昵称，格式：修改昵称 <新昵称>")
            await update_nickname.finish(msg)

        qq_number = str(event.user_id)
        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        await api_client.members.update_nickname(qq_number, new_nickname)

        msg = MessageBuilder.build_success_message(f"昵称已修改为: {new_nickname}")
        await update_nickname.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        raise

    except APIError as e:
        logger.error(f"API 错误: {e}")
        msg = MessageBuilder.build_error_message(f"修改昵称失败: {e}")
        await update_nickname.finish(msg)

    except Exception as e:
        logger.exception(f"未知错误: {e}")
        msg = MessageBuilder.build_error_message("系统错误，请联系管理员")
        await update_nickname.finish(msg)


# ==================== 报名相关关键词匹配 ====================
# 使用 on_keyword 进行第一层过滤
signup_keywords = on_keyword(
    {"报名", "代报", "老板", "取消报名", "取消", "报"},
    priority=20,
    block=False  # 不阻断，让后续处理决定
)


@signup_keywords.handle()
async def handle_signup_keywords(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """
    处理报名相关的消息
    
    步骤：
    1. 已通过关键词过滤（由 on_keyword 完成）
    2. 二次过滤（排除询问类消息、正在会话中的消息）
    3. 预查询数据
    4. NLP 解析意图
    5. 根据意图分别处理
    """
    try:
        guild_id = event.group_id
        qq_number = str(event.user_id)
        session_manager = get_session_manager()
        
        # ========== 第二步：二次过滤 ==========
        
        # 检查是否正在进行会话（防止多轮对话冲突）
        existing_session = session_manager.get_session(qq_number, str(guild_id))
        if existing_session:
            # 如果是会话中的消息，由 session_handler 处理
            return
        
        # 排除询问类消息
        if is_question_or_statement(plain_text):
            logger.debug(f"消息被识别为询问类，跳过: {plain_text[:50]}")
            return
        
        # ========== 第三步：预查询数据 ==========
        api_client = get_api_client(guild_id=guild_id)
        context = await pre_query_context(api_client, qq_number, guild_id)
        
        # ========== 第四步：NLP 解析意图 ==========
        parse_context = {
            "user_id": qq_number,
            "group_id": str(guild_id),
            "api_client": api_client,
            **context,  # 包含 teams, user_characters, user_signups
        }
        
        parser = get_parser()
        intent = await parser.parse(plain_text, parse_context)
        
        # 调试日志
        logger.info(f"[NLP解析] 原始消息: {plain_text}")
        logger.info(f"[NLP解析] 解析结果: {intent}")
        if intent:
            logger.info(f"[NLP解析] 动作: {intent.action}, 参数: {intent.params}")
        
        # 如果无法解析或置信度太低，不处理
        if not intent:
            return
        
        if intent.confidence < 0.5:
            logger.info(f"[NLP解析] 置信度过低 ({intent.confidence})，跳过")
            return
        
        # 如果需要追问用户
        if intent.need_followup and intent.followup_question:
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
            await signup_keywords.finish(intent.followup_question)
        
        # ========== 第五步：根据意图分别处理 ==========
        
        # 获取团队信息
        team_service = TeamService(api_client)
        teams = await team_service.get_teams()
        
        team_index = intent.params.get("team_index")
        try:
            team = await team_service.get_team_by_index(teams, team_index)
        except ValueError as e:
            msg = MessageBuilder.build_error_message(str(e))
            await signup_keywords.finish(msg)
        
        # 根据意图类型处理
        if intent.action == "signup":
            await _handle_self_signup(
                signup_keywords, api_client, event, team.id, intent.params, context
            )
        elif intent.action == "proxy_signup":
            await _handle_proxy_signup(
                signup_keywords, api_client, event, team.id, intent.params
            )
        elif intent.action == "register_rich":
            await _handle_register_rich(
                signup_keywords, api_client, event, team.id, intent.params
            )
        elif intent.action == "cancel_signup":
            await _handle_cancel_signup(
                signup_keywords, api_client, event, team.id, intent.params, context
            )

    except (FinishedException, PausedException, RejectedException):
        raise

    except APIError as e:
        logger.error(f"API 错误: {e}")
        msg = MessageBuilder.build_error_message(f"操作失败: {e}")
        await signup_keywords.finish(msg)

    except Exception as e:
        logger.exception(f"未知错误: {e}")
        # 不 finish，让消息继续传递
        return


async def _handle_self_signup(
    matcher,
    api_client,
    event: GroupMessageEvent,
    team_id: int,
    params: dict,
    context: dict
):
    """
    处理自己报名
    
    逻辑：
    1. 检查是否已报名（防止重复报名）
    2. 构建报名信息
    3. 调用后端 API
    """
    try:
        qq_number = str(event.user_id)
        
        # 检查是否已经报名（通过 player_qq_number 判断是否是自己的报名）
        user_signups = context.get("user_signups", [])
        existing_self_signups = [
            s for s in user_signups 
            if s["team_id"] == team_id 
            and s.get("player_qq_number") == qq_number  # 通过 QQ 号判断
        ]
        
        if existing_self_signups:
            # 已有报名，检查是否是相同心法
            xinfa_key = params.get("xinfa_key")
            same_xinfa = [s for s in existing_self_signups if s.get("xinfa") == xinfa_key]
            if same_xinfa:
                xinfa_display = format_xinfa_display(xinfa_key)
                msg = MessageBuilder.build_error_message(
                    f"你已经用 {xinfa_display} 报名过该团队了，如需修改请先取消"
                )
                await matcher.finish(msg)
        
        # 获取心法
        xinfa_key = params.get("xinfa_key")
        if not xinfa_key:
            msg = MessageBuilder.build_error_message("请指定心法，例如：报1 藏剑")
            await matcher.finish(msg)
        
        # 尝试获取用户昵称
        try:
            member = await api_client.members.get_member(qq_number)
            user_nickname = member.group_nickname or member.nickname or qq_number
        except:
            user_nickname = qq_number
        
        # 构建报名请求
        signup_request = {
            "qq_number": qq_number,
            "xinfa": xinfa_key,
            "character_id": params.get("character_id"),
            "character_name": params.get("character_name"),
            "is_rich": False,
        }
        
        # 调用后端 API
        from ..api.models import SignupRequest
        signup_info = await api_client.signups.create_signup(
            team_id,
            SignupRequest(**signup_request)
        )
        
        # 构建成功消息
        xinfa_display = format_xinfa_display(xinfa_key)
        char_name = signup_info.signup_info.get("character_name", "") or "待定"
        msg = MessageBuilder.build_success_message(
            f"报名成功！\n"
            f"心法: {xinfa_display}\n"
            f"角色: {char_name}"
        )
        await matcher.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        raise

    except APIError as e:
        msg = MessageBuilder.build_error_message(f"报名失败: {e}")
        await matcher.finish(msg)

    except Exception as e:
        logger.exception(f"报名处理失败: {e}")
        msg = MessageBuilder.build_error_message(f"报名失败: {str(e)}")
        await matcher.finish(msg)


async def _handle_proxy_signup(
    matcher,
    api_client,
    event: GroupMessageEvent,
    team_id: int,
    params: dict
):
    """
    处理代他人报名
    
    逻辑：
    1. 获取被报名用户昵称
    2. 构建报名信息（signup_user_id 为空）
    3. 调用后端 API
    """
    try:
        qq_number = str(event.user_id)
        
        # 获取被报名用户昵称
        player_name = params.get("player_name")
        if not player_name:
            msg = MessageBuilder.build_error_message("请指定被报名的用户名，例如：帮张三报1藏剑")
            await matcher.finish(msg)
        
        # 获取心法
        xinfa_key = params.get("xinfa_key")
        if not xinfa_key:
            msg = MessageBuilder.build_error_message("请指定心法，例如：帮张三报1藏剑")
            await matcher.finish(msg)
        
        # 尝试获取提交者昵称
        try:
            member = await api_client.members.get_member(qq_number)
            submitter_nickname = member.group_nickname or member.nickname or qq_number
        except:
            submitter_nickname = qq_number
        
        # 构建报名请求（代报名模式）
        signup_request = {
            "qq_number": qq_number,  # 提交者的 QQ
            "xinfa": xinfa_key,
            "character_name": params.get("character_name"),
            "is_rich": False,
            "is_proxy": True,
            "player_name": player_name,
        }
        
        # 调用后端 API（需要修改后端支持代报名）
        from ..api.models import SignupRequest
        signup_info = await api_client.signups.create_signup(
            team_id,
            SignupRequest(**signup_request)
        )
        
        xinfa_display = format_xinfa_display(xinfa_key)
        char_name = params.get("character_name") or "待定"
        msg = MessageBuilder.build_success_message(
            f"代报名成功！\n"
            f"已为 {player_name} 报名\n"
            f"心法: {xinfa_display}\n"
            f"角色: {char_name}"
        )
        await matcher.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        raise

    except APIError as e:
        msg = MessageBuilder.build_error_message(f"代报名失败: {e}")
        await matcher.finish(msg)

    except Exception as e:
        logger.exception(f"代报名处理失败: {e}")
        msg = MessageBuilder.build_error_message(f"代报名失败: {str(e)}")
        await matcher.finish(msg)


async def _handle_register_rich(
    matcher,
    api_client,
    event: GroupMessageEvent,
    team_id: int,
    params: dict
):
    """
    处理登记老板
    
    逻辑：
    1. 获取老板名称
    2. 构建报名信息（is_rich=True）
    3. 调用后端 API
    """
    try:
        qq_number = str(event.user_id)
        
        # 获取老板名称
        boss_name = params.get("player_name")
        if not boss_name:
            msg = MessageBuilder.build_error_message("请指定老板名称，例如：登记老板 张三 藏剑")
            await matcher.finish(msg)
        
        # 获取心法
        xinfa_key = params.get("xinfa_key")
        if not xinfa_key:
            msg = MessageBuilder.build_error_message("请指定心法，例如：登记老板 张三 藏剑")
            await matcher.finish(msg)
        
        # 尝试获取提交者昵称
        try:
            member = await api_client.members.get_member(qq_number)
            submitter_nickname = member.group_nickname or member.nickname or qq_number
        except:
            submitter_nickname = qq_number
        
        # 构建报名请求（老板模式）
        signup_request = {
            "qq_number": qq_number,  # 提交者的 QQ
            "xinfa": xinfa_key,
            "is_rich": True,
            "is_proxy": True,
            "player_name": boss_name,
        }
        
        # 调用后端 API
        from ..api.models import SignupRequest
        signup_info = await api_client.signups.create_signup(
            team_id,
            SignupRequest(**signup_request)
        )
        
        xinfa_display = format_xinfa_display(xinfa_key)
        msg = MessageBuilder.build_success_message(
            f"老板登记成功！\n"
            f"老板: {boss_name}\n"
            f"心法: {xinfa_display}"
        )
        await matcher.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        raise

    except APIError as e:
        msg = MessageBuilder.build_error_message(f"登记老板失败: {e}")
        await matcher.finish(msg)

    except Exception as e:
        logger.exception(f"登记老板处理失败: {e}")
        msg = MessageBuilder.build_error_message(f"登记老板失败: {str(e)}")
        await matcher.finish(msg)


async def _handle_cancel_signup(
    matcher,
    api_client,
    event: GroupMessageEvent,
    team_id: int,
    params: dict,
    context: dict
):
    """
    处理取消报名
    
    逻辑：
    1. 从 NLP 解析结果获取 signup_id
    2. 如果 signup_id 明确，直接取消
    3. 如果不明确，展示列表让用户选择
    """
    try:
        qq_number = str(event.user_id)
        session_manager = get_session_manager()
        
        # 获取用户在该团队的报名
        user_signups = [s for s in context.get("user_signups", []) if s["team_id"] == team_id]
        
        if not user_signups:
            msg = MessageBuilder.build_error_message("你在该团队没有报名记录")
            await matcher.finish(msg)
        
        # 尝试从 NLP 结果获取 signup_id
        signup_id = params.get("signup_id")
        
        # 如果只有一个报名，直接使用
        if len(user_signups) == 1 and not signup_id:
            signup_id = user_signups[0]["signup_id"]
        
        # 如果有明确的 signup_id，直接取消
        if signup_id:
            await api_client.signups.cancel_signup(team_id, qq_number, signup_id=signup_id)
            
            # 查找对应的报名信息用于显示
            signup_info = next((s for s in user_signups if s["signup_id"] == signup_id), None)
            if signup_info:
                xinfa_display = format_xinfa_display(signup_info.get("xinfa", ""))
                char_name = signup_info.get("character_name", "") or "待定"
            else:
                xinfa_display = "未知"
                char_name = "未知"
            
            msg = MessageBuilder.build_success_message(
                f"取消报名成功！\n"
                f"心法: {xinfa_display}\n"
                f"角色: {char_name}"
            )
            await matcher.finish(msg)
        
        # 尝试通过心法匹配
        xinfa_key = params.get("xinfa_key")
        if xinfa_key:
            matched = [s for s in user_signups if s.get("xinfa") == xinfa_key]
            if len(matched) == 1:
                signup_id = matched[0]["signup_id"]
                await api_client.signups.cancel_signup(team_id, qq_number, signup_id=signup_id)
                
                xinfa_display = format_xinfa_display(matched[0].get("xinfa", ""))
                char_name = matched[0].get("character_name", "") or "待定"
                msg = MessageBuilder.build_success_message(
                    f"取消报名成功！\n"
                    f"心法: {xinfa_display}\n"
                    f"角色: {char_name}"
                )
                await matcher.finish(msg)
        
        # 无法确定，创建会话让用户选择
        session_manager.create_session(
            user_id=qq_number,
            group_id=str(event.group_id),
            action="cancel_signup_select",
            data={
                "team_id": team_id,
                "signups": [
                    {
                        "signup_id": s["signup_id"],
                        "xinfa": format_xinfa_display(s.get("xinfa", "")),
                        "character_name": s.get("character_name", "") or "待定",
                        "player_name": s.get("player_name", ""),
                        "is_rich": s.get("is_rich", False),
                    }
                    for s in user_signups
                ]
            }
        )
        
        # 构建选择列表
        msg_parts = ["你有多个报名，请选择要取消的报名：\n"]
        for idx, signup in enumerate(user_signups, 1):
            xinfa_display = format_xinfa_display(signup.get("xinfa", ""))
            char_name = signup.get("character_name", "") or "待定"
            player_name = signup.get("player_name", "")
            rich_tag = " [老板]" if signup.get("is_rich") else ""
            
            if player_name and player_name != char_name:
                msg_parts.append(f"\n【{idx}】{player_name} - {xinfa_display} - {char_name}{rich_tag}")
            else:
                msg_parts.append(f"\n【{idx}】{xinfa_display} - {char_name}{rich_tag}")
        
        msg_parts.append("\n\n请回复序号进行取消")
        await matcher.finish(Message("".join(msg_parts)))

    except (FinishedException, PausedException, RejectedException):
        raise

    except APIError as e:
        msg = MessageBuilder.build_error_message(f"取消报名失败: {e}")
        await matcher.finish(msg)

    except Exception as e:
        logger.exception(f"取消报名处理失败: {e}")
        msg = MessageBuilder.build_error_message(f"取消报名失败: {str(e)}")
        await matcher.finish(msg)


# ==================== 会话处理 ====================
session_handler = on_message(
    priority=15,  # 优先级高于 signup_keywords
    block=False
)


@session_handler.handle()
async def handle_session_message(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """处理会话中的用户消息"""
    session_manager = get_session_manager()
    qq_number = str(event.user_id)
    group_id = str(event.group_id)

    session = session_manager.get_session(qq_number, group_id)

    if not session:
        return

    if session.action == "cancel_signup_select":
        await _handle_cancel_signup_select(
            session_handler, event, session, plain_text.strip()
        )
    elif session.action == "nlp_followup":
        await _handle_nlp_followup(
            session_handler, event, session, plain_text.strip()
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
            return

        signups = session.data.get("signups", [])
        team_id = session.data.get("team_id")

        if index < 1 or index > len(signups):
            msg = MessageBuilder.build_error_message(f"无效的序号，请输入 1-{len(signups)} 之间的数字")
            await matcher.send(msg)
            return

        selected_signup = signups[index - 1]
        signup_id = selected_signup["signup_id"]

        # 调用 API 取消报名（使用 signup_id）
        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        qq_number = str(event.user_id)
        await api_client.signups.cancel_signup(team_id, qq_number, signup_id=signup_id)

        # 关闭会话
        session_manager = get_session_manager()
        session_manager.close_session(qq_number, str(event.group_id))

        xinfa = selected_signup["xinfa"]
        char_name = selected_signup["character_name"]
        msg = MessageBuilder.build_success_message(
            f"取消报名成功！\n心法: {xinfa}\n角色: {char_name}"
        )
        await matcher.finish(msg)

    except (FinishedException, PausedException, RejectedException):
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

        history = session.data.get("history", [])
        history.append({"role": "user", "content": user_input})

        api_client = get_api_client(guild_id=guild_id)
        
        # 预查询上下文
        context = await pre_query_context(api_client, qq_number, guild_id)
        
        parse_context = {
            "user_id": qq_number,
            "group_id": str(guild_id),
            "api_client": api_client,
            **context,
        }

        parser = get_parser()
        
        if hasattr(parser, 'parse') and 'history' in parser.parse.__code__.co_varnames:
            intent = await parser.parse(user_input, parse_context, history=history)
        else:
            intent = await parser.parse(user_input, parse_context)

        logger.info(f"[NLP多轮] 用户输入: {user_input}")
        logger.info(f"[NLP多轮] 解析结果: {intent}")

        if not intent:
            return

        if intent.need_followup and intent.followup_question:
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

        # 获取团队服务
        team_service = TeamService(api_client)
        teams = await team_service.get_teams()

        team_index = intent.params.get("team_index")
        try:
            team = await team_service.get_team_by_index(teams, team_index)
        except ValueError as e:
            msg = MessageBuilder.build_error_message(str(e))
            await matcher.finish(msg)

        if intent.action == "signup":
            await _handle_self_signup(matcher, api_client, event, team.id, intent.params, context)
        elif intent.action == "proxy_signup":
            await _handle_proxy_signup(matcher, api_client, event, team.id, intent.params)
        elif intent.action == "register_rich":
            await _handle_register_rich(matcher, api_client, event, team.id, intent.params)
        elif intent.action == "cancel_signup":
            await _handle_cancel_signup(matcher, api_client, event, team.id, intent.params, context)

    except (FinishedException, PausedException, RejectedException):
        raise

    except APIError as e:
        logger.error(f"API 错误: {e}")
        msg = MessageBuilder.build_error_message(f"操作失败: {e}")
        await matcher.finish(msg)

    except Exception as e:
        logger.exception(f"处理 NLP 追问失败: {e}")
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
    """处理初始化成员命令 - 将当前群的所有成员同步到后端"""
    try:
        group_id = event.group_id

        await init_members.send("正在获取群成员列表，请稍候...")

        logger.info(f"开始获取群 {group_id} 的成员列表")
        group_members = await bot.get_group_member_list(group_id=group_id)

        logger.info(f"获取到 {len(group_members)} 个群成员")

        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        member_service = MemberService(api_client)

        await init_members.send(f"获取到 {len(group_members)} 个群成员，开始同步到后端...")

        result = await member_service.sync_all_members(group_members)

        msg = MessageBuilder.build_success_message(
            f"成员同步完成！\n"
            f"总成员数: {result['total']}\n"
            f"新增成员: {result['added']}\n"
            f"已存在成员: {result['existed']}"
        )
        await init_members.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        raise

    except APIError as e:
        logger.error(f"API 错误: {e}")
        msg = MessageBuilder.build_error_message(f"同步成员失败: {e}")
        await init_members.finish(msg)

    except Exception as e:
        logger.exception(f"初始化成员失败: {e}")
        msg = MessageBuilder.build_error_message(f"初始化成员失败: {str(e)}")
        await init_members.finish(msg)
