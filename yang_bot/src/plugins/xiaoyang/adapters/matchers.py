"""NoneBot Matcher 定义和处理函数（重构版 v2）

不再使用 LLM 解析用户意图，完全基于 NoneBot 的事件机制处理固定格式命令。

命令格式（不加前缀 /）：
- 报名 [副本编号] [心法] [角色昵称]
- 取消报名 <副本编号>
- 代报名 <副本编号> <被报名人昵称> <心法> [角色昵称]
- 添加角色 <心法> <角色昵称>
- 查看团队 / 查团 / 有团吗 / 有车吗
- 修改昵称 <新昵称>
"""
import re
from nonebot import on_keyword, on_message
from nonebot.adapters.onebot.v11 import Bot, GroupMessageEvent, Message
from nonebot.params import EventPlainText
from nonebot.log import logger
from nonebot.permission import SUPERUSER
from nonebot.adapters.onebot.v11.permission import GROUP_OWNER
from nonebot.exception import FinishedException, PausedException, RejectedException
from typing import Optional, List, Tuple

from ..api.client import get_api_client, APIError
from ..api.models import SignupRequest
from ..services.team_service import TeamService
from ..services.character_service import CharacterService
from ..services.member_service import MemberService, clean_and_truncate_nickname
from ..services.session_manager import get_session_manager
from .message_builder import MessageBuilder
from ..data.xinfa import (
    normalize_xinfa_name, get_xinfa_key, XINFA_INFO,
    is_xinfa_name,
)


# ==================== 辅助函数 ====================

def format_xinfa_display(xinfa: str) -> str:
    """格式化心法名用于输出显示"""
    if not xinfa:
        return "未知"
    if xinfa in XINFA_INFO:
        return XINFA_INFO[xinfa]["name"]
    normalized = normalize_xinfa_name(xinfa)
    return normalized if normalized != xinfa or not xinfa else xinfa


def parse_signup_args(text: str) -> Tuple[Optional[int], Optional[str], Optional[str]]:
    """
    解析报名命令参数，返回 (副本编号, 参数1, 参数2)

    副本编号（数字）可以出现在任意位置，其余按顺序作为 arg1、arg2。

    支持格式：
    - ""                          -> (None, None, None)
    - "丐帮"                       -> (None, "丐帮", None)
    - "1 丐帮"                     -> (1, "丐帮", None)
    - "丐帮 1"                     -> (1, "丐帮", None)
    - "丐帮 丐箩箩"                -> (None, "丐帮", "丐箩箩")
    - "1 丐帮 丐箩箩"               -> (1, "丐帮", "丐箩箩")
    - "丐帮 1 丐箩箩"               -> (1, "丐帮", "丐箩箩")
    - "丐帮 丐箩箩 1"               -> (1, "丐帮", "丐箩箩")
    """
    parts = text.strip().split()
    if not parts:
        return None, None, None

    team_index = None
    non_number_parts = []

    for part in parts:
        try:
            num = int(part)
            if team_index is None:
                team_index = num
            else:
                # 多个数字，后续当作普通参数
                non_number_parts.append(part)
        except ValueError:
            non_number_parts.append(part)

    arg1 = non_number_parts[0] if len(non_number_parts) > 0 else None
    arg2 = non_number_parts[1] if len(non_number_parts) > 1 else None

    return team_index, arg1, arg2


def resolve_xinfa_and_character(
    arg1: Optional[str],
    arg2: Optional[str],
) -> Tuple[Optional[str], Optional[str]]:
    """
    根据两个参数识别心法和角色昵称。

    规则：
    - 只有一个参数：先看是否是心法名
    - 两个参数：如果只有一个匹配心法，那个是心法，另一个是角色名
    - 两个都匹配心法：第一个当心法，第二个当角色名

    Returns:
        (xinfa_key, character_name)
    """
    if arg1 is None and arg2 is None:
        return None, None

    if arg2 is None:
        # 只有一个参数
        if is_xinfa_name(arg1):
            return get_xinfa_key(arg1), None
        else:
            return None, arg1

    # 两个参数
    is_arg1_xinfa = is_xinfa_name(arg1)
    is_arg2_xinfa = is_xinfa_name(arg2)

    if is_arg1_xinfa and not is_arg2_xinfa:
        return get_xinfa_key(arg1), arg2
    elif not is_arg1_xinfa and is_arg2_xinfa:
        return get_xinfa_key(arg2), arg1
    elif is_arg1_xinfa and is_arg2_xinfa:
        # 都匹配心法，第一个当心法，第二个当角色昵称
        return get_xinfa_key(arg1), arg2
    else:
        # 都不匹配心法 - 无法确定
        return None, None


async def get_single_open_team(team_service: TeamService):
    """获取团队列表，如果只有一个则直接返回"""
    teams = await team_service.get_teams()
    # 过滤掉锁定的团队
    open_teams = [t for t in teams if not t.is_locked]
    return open_teams


async def resolve_team(
    team_service: TeamService,
    team_index: Optional[int]
) -> Tuple[any, int, List]:
    """
    解析团队，返回 (team, index, all_teams)

    如果 team_index 为 None 且只有一个团队，自动选择
    """
    teams = await get_single_open_team(team_service)

    if not teams:
        raise ValueError("当前没有可报名的团队")

    if team_index is None:
        if len(teams) == 1:
            return teams[0], 1, teams
        else:
            # 构建提示
            team_list = "\n".join(
                f"  【{i+1}】{t.title} - {t.dungeon}"
                for i, t in enumerate(teams)
            )
            raise ValueError(
                f"当前有多个团队，请指定副本编号：\n{team_list}\n\n"
                f"示例：报名 1 丐帮 丐箩箩"
            )

    try:
        team = await team_service.get_team_by_index(teams, team_index)
        return team, team_index, teams
    except ValueError:
        raise ValueError(f"副本编号无效，请输入 1-{len(teams)} 之间的数字")


# ==================== 查看团队 ====================
view_teams = on_keyword(
    {"查看团队", "查团", "有团吗", "有车吗"},
    priority=10,
    block=True
)


@view_teams.handle()
async def handle_view_teams(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """处理查看团队命令"""
    try:
        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        team_service = TeamService(api_client)

        teams = await team_service.get_teams()

        # 提取参数
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
        elif args_text in ["全部", "all", "ALL"]:
            if not teams:
                await view_teams.finish(MessageBuilder.build_error_message("当前没有开放的团队"))

            for idx, team in enumerate(teams, 1):
                msg = await MessageBuilder.build_team_detail(team, idx, str(guild_id))
                if idx < len(teams):
                    await view_teams.send(msg)
                else:
                    await view_teams.finish(msg)
        else:
            try:
                index = int(args_text)
                team = await team_service.get_team_by_index(teams, index)
                msg = await MessageBuilder.build_team_detail(team, index, str(guild_id))
                await view_teams.finish(msg)
            except ValueError as e:
                await view_teams.finish(MessageBuilder.build_error_message(str(e)))

    except (FinishedException, PausedException, RejectedException):
        raise
    except APIError as e:
        logger.error(f"API 错误: {e}")
        await view_teams.finish(MessageBuilder.build_error_message(f"获取团队列表失败: {e}"))
    except Exception as e:
        logger.exception(f"未知错误: {e}")
        await view_teams.finish(MessageBuilder.build_error_message("系统错误，请联系管理员"))


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
        raw_nickname = plain_text.replace("修改昵称", "", 1).strip()

        if not raw_nickname:
            await update_nickname.finish(
                MessageBuilder.build_error_message("请提供新昵称，格式：修改昵称 <新昵称>")
            )

        qq_number = str(event.user_id)
        new_nickname = clean_and_truncate_nickname(raw_nickname, fallback=qq_number)

        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        await api_client.members.update_nickname(qq_number, new_nickname)

        if new_nickname != raw_nickname:
            msg = MessageBuilder.build_success_message(
                f"昵称已修改为: {new_nickname}\n"
                f"（原昵称包含特殊字符或超长，已自动处理）"
            )
        else:
            msg = MessageBuilder.build_success_message(f"昵称已修改为: {new_nickname}")
        await update_nickname.finish(msg)

    except (FinishedException, PausedException, RejectedException):
        raise
    except APIError as e:
        logger.error(f"API 错误: {e}")
        await update_nickname.finish(MessageBuilder.build_error_message(f"修改昵称失败: {e}"))
    except Exception as e:
        logger.exception(f"未知错误: {e}")
        await update_nickname.finish(MessageBuilder.build_error_message("系统错误，请联系管理员"))


# ==================== 报名 ====================
signup_matcher = on_keyword(
    {"报名"},
    priority=20,
    block=True
)

# 排除的关键词前缀
SIGNUP_EXCLUDE_PREFIXES = ["取消报名", "代报名", "取消"]
# 排除的询问类正则模式
SIGNUP_EXCLUDE_PATTERNS = [
    r"有.*吗[？?]?$",
    r"还有.*吗[？?]?$",
    r".*多少.*[？?]$",
    r"什么时候",
    r"几点",
    r"谁.*报名",
]


@signup_matcher.handle()
async def handle_signup(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """
    处理报名命令

    支持格式（编号可在任意位置）：
    - 报名 丐帮                    → 只有一个团时省略编号,只提供心法
    - 报名 丐帮 丐箩箩             → 省略编号,心法+角色名
    - 报名 丐箩箩 丐帮             → 角色名和心法可以互换
    - 报名 1 丐帮                   → 指定团队编号和心法
    - 报名 丐帮 1                   → 编号放后面也行
    - 报名 1 丐帮 丐箩箩           → 完整格式
    - 报名 丐帮 丐箩箩 1           → 编号在末尾
    - 报名 丐帮 1 丐箩箩           → 编号在中间
    - 报名 丐箩箩                  → 只提供角色名（需要角色信息已录入）

    注意：单独输入「报名」不会触发报名
    """
    try:
        # 排除取消报名/代报名等
        stripped = plain_text.strip()
        for prefix in SIGNUP_EXCLUDE_PREFIXES:
            if stripped.startswith(prefix):
                return

        # 排除询问类消息
        for pattern in SIGNUP_EXCLUDE_PATTERNS:
            if re.search(pattern, stripped):
                return

        guild_id = event.group_id
        qq_number = str(event.user_id)

        # 检查是否在会话中
        session_manager = get_session_manager()
        if session_manager.get_session(qq_number, str(guild_id)):
            return

        api_client = get_api_client(guild_id=guild_id)
        team_service = TeamService(api_client)
        char_service = CharacterService(api_client)

        # 提取「报名」后面的参数
        # 找到 "报名" 的位置并取后面的文本
        signup_idx = stripped.find("报名")
        if signup_idx == -1:
            return
        args_text = stripped[signup_idx + len("报名"):].strip()

        # 解析参数
        team_index, arg1, arg2 = parse_signup_args(args_text)

        # 解析团队
        try:
            team, resolved_index, teams = await resolve_team(team_service, team_index)
        except ValueError as e:
            await signup_matcher.finish(MessageBuilder.build_error_message(str(e)))

        # 解析心法和角色名
        xinfa_key, character_name = resolve_xinfa_and_character(arg1, arg2)

        # 获取用户角色列表
        try:
            user_characters = await char_service.get_user_characters(qq_number)
        except Exception:
            user_characters = []

        # ===== 分场景处理 =====

        if xinfa_key and character_name:
            # 场景1: 心法+角色名都提供了 → 直接报名
            await _do_signup(
                signup_matcher, api_client, char_service, event,
                team, resolved_index, xinfa_key, character_name,
                user_characters
            )

        elif xinfa_key and not character_name:
            # 场景2: 只提供了心法 → 查找匹配角色
            matching_chars = [
                c for c in user_characters
                if c.xinfa == xinfa_key or (
                    c.secondary_xinfas and xinfa_key in c.secondary_xinfas
                )
            ]

            if len(matching_chars) == 1:
                # 唯一匹配，直接报名
                char = matching_chars[0]
                await _do_signup(
                    signup_matcher, api_client, char_service, event,
                    team, resolved_index, xinfa_key, char.name,
                    user_characters, character_id=char.id
                )
            elif len(matching_chars) > 1:
                # 多个匹配，创建会话让用户选择
                session_manager.create_session(
                    user_id=qq_number,
                    group_id=str(guild_id),
                    action="signup_select_character",
                    data={
                        "team_id": team.id,
                        "team_index": resolved_index,
                        "xinfa_key": xinfa_key,
                        "characters": [
                            {"id": c.id, "name": c.name, "xinfa": c.xinfa}
                            for c in matching_chars
                        ],
                    }
                )
                xinfa_display = format_xinfa_display(xinfa_key)
                char_list = "\n".join(
                    f"  【{i+1}】{c.name}"
                    for i, c in enumerate(matching_chars)
                )
                await signup_matcher.finish(Message(
                    f"你有多个 {xinfa_display} 的角色，要用哪一个报名？\n"
                    f"{char_list}\n\n"
                    f"请回复序号或角色名"
                ))
            else:
                # 没有匹配的角色，直接用心法报名（模糊报名）
                await _do_signup(
                    signup_matcher, api_client, char_service, event,
                    team, resolved_index, xinfa_key, None,
                    user_characters
                )

        elif not xinfa_key and character_name:
            # 场景3: 只提供了角色名 → 查找角色获取心法
            matched_chars = [c for c in user_characters if c.name == character_name]

            if len(matched_chars) == 1:
                char = matched_chars[0]
                # 检查是否多修
                all_xinfas = [char.xinfa]
                if char.secondary_xinfas:
                    all_xinfas.extend(char.secondary_xinfas)

                if len(all_xinfas) == 1:
                    await _do_signup(
                        signup_matcher, api_client, char_service, event,
                        team, resolved_index, char.xinfa, char.name,
                        user_characters, character_id=char.id
                    )
                else:
                    # 多修角色，让用户选心法
                    session_manager.create_session(
                        user_id=qq_number,
                        group_id=str(guild_id),
                        action="signup_select_xinfa",
                        data={
                            "team_id": team.id,
                            "team_index": resolved_index,
                            "character_id": char.id,
                            "character_name": char.name,
                            "xinfas": all_xinfas,
                        }
                    )
                    xinfa_list = "\n".join(
                        f"  【{i+1}】{format_xinfa_display(x)}"
                        for i, x in enumerate(all_xinfas)
                    )
                    await signup_matcher.finish(Message(
                        f"角色 {char.name} 有多个心法，要用哪个心法报名？\n"
                        f"{xinfa_list}\n\n"
                        f"请回复序号或心法名"
                    ))
            elif len(matched_chars) == 0:
                # 角色不存在
                await signup_matcher.finish(MessageBuilder.build_error_message(
                    f"未找到角色「{character_name}」\n\n"
                    f"如果是新角色，请使用完整格式报名：\n"
                    f"  报名 {resolved_index} 心法 角色名\n"
                    f"例如：报名 {resolved_index} 丐帮 丐箩箩\n\n"
                    f"或者先添加角色：\n"
                    f"  添加角色 心法 角色名\n"
                    f"例如：添加角色 丐帮 丐箩箩"
                ))
            else:
                # 多个同名角色（不太可能但防御性处理）
                await signup_matcher.finish(MessageBuilder.build_error_message(
                    f"找到多个同名角色「{character_name}」，请使用完整格式：\n"
                    f"  报名 {resolved_index} 心法 {character_name}"
                ))

        else:
            # 场景4: 什么都没提供（或无法识别）
            if not args_text:
                # 用户只输入了 "报名"，拒绝
                await signup_matcher.finish(MessageBuilder.build_error_message(
                    "请提供报名信息\n\n"
                    "格式：报名 [编号] 心法 [角色名]\n"
                    "例如：报名 丐帮 丐箩箩\n"
                    "例如：报名 1 丐帮\n\n"
                    "编号可以放在任意位置，心法和角色名可互换\n"
                    "如果已添加角色，也可以只写心法或角色名：\n"
                    "  报名 丐帮\n"
                    "  报名 丐箩箩"
                ))
            else:
                # arg1 和 arg2 都不是心法也不是已知角色
                await signup_matcher.finish(MessageBuilder.build_error_message(
                    f"无法识别输入「{args_text}」\n\n"
                    f"请检查心法名是否正确，或者使用完整格式：\n"
                    f"  报名 心法 角色名 [编号]\n"
                    f"例如：报名 丐帮 丐箩箩"
                ))

    except (FinishedException, PausedException, RejectedException):
        raise
    except APIError as e:
        logger.error(f"API 错误: {e}")
        await signup_matcher.finish(MessageBuilder.build_error_message(f"报名失败: {e}"))
    except Exception as e:
        logger.exception(f"报名处理失败: {e}")
        await signup_matcher.finish(MessageBuilder.build_error_message(f"报名失败: {str(e)}"))


async def _do_signup(
    matcher,
    api_client,
    char_service: CharacterService,
    event: GroupMessageEvent,
    team,
    team_index: int,
    xinfa_key: str,
    character_name: Optional[str],
    user_characters: list,
    character_id: Optional[int] = None,
):
    """
    执行实际的报名操作

    如果角色昵称存在但没有录入系统，自动创建角色。
    """
    qq_number = str(event.user_id)
    guild_id = event.group_id

    # 如果没有character_id但有character_name，尝试查找或创建
    if not character_id and character_name:
        existing = next((c for c in user_characters if c.name == character_name), None)
        if existing:
            character_id = existing.id
            # 检查心法是否需要添加多修
            if existing.xinfa != xinfa_key:
                existing_xinfas = [existing.xinfa]
                if existing.secondary_xinfas:
                    existing_xinfas.extend(existing.secondary_xinfas)
                if xinfa_key not in existing_xinfas:
                    # TODO: 添加多修心法的API支持
                    logger.info(f"角色 {character_name} 新增心法 {xinfa_key}（暂不支持API添加多修）")
        else:
            # 自动创建角色
            try:
                new_char = await char_service.create_character(
                    qq_number=qq_number,
                    name=character_name,
                    xinfa=xinfa_key,
                )
                character_id = new_char.id
                logger.info(f"自动创建角色: {character_name} ({format_xinfa_display(xinfa_key)})")
            except Exception as e:
                logger.warning(f"自动创建角色失败: {e}")
                # 创建失败也继续报名，使用字符串模式

    # 检查重复报名
    try:
        existing_signups = await api_client.signups.get_user_signups(team.id, qq_number)
        for signup in existing_signups:
            if (signup.signup_info.get("xinfa") == xinfa_key and
                    str(signup.signup_info.get("player_qq_number", "")) == qq_number):
                xinfa_display = format_xinfa_display(xinfa_key)
                await matcher.finish(MessageBuilder.build_error_message(
                    f"你已经用 {xinfa_display} 报名过该团队了，如需修改请先取消报名"
                ))
    except Exception:
        pass

    # 构建报名请求
    signup_request = SignupRequest(
        qq_number=qq_number,
        xinfa=xinfa_key,
        character_id=character_id,
        character_name=character_name,
        is_rich=False,
        is_proxy=False,
    )

    signup_info = await api_client.signups.create_signup(team.id, signup_request)

    # 构建成功消息
    xinfa_display = format_xinfa_display(xinfa_key)
    char_display = character_name or signup_info.signup_info.get("character_name", "") or "待定"

    msg = MessageBuilder.build_signup_result_message(
        player_name=char_display,
        xinfa=xinfa_display,
        allocation_status=signup_info.allocation_status,
        allocated_slot=signup_info.allocated_slot,
        waitlist_position=signup_info.waitlist_position,
        is_proxy=False,
        is_rich=False,
    )

    auto_create_hint = ""
    if character_name and not any(c.name == character_name for c in user_characters):
        auto_create_hint = f"\n💡 已自动录入角色：{char_display}（{xinfa_display}）"

    if auto_create_hint:
        await matcher.send(Message(str(msg) + auto_create_hint))
    else:
        await matcher.send(msg)

    # 发送团队截图
    try:
        updated_teams = await TeamService(api_client).get_teams()
        for idx, t in enumerate(updated_teams, 1):
            if t.id == team.id:
                team_image_msg = await MessageBuilder.build_team_detail(t, idx, str(guild_id))
                await matcher.finish(team_image_msg)
                break
        else:
            await matcher.finish()
    except Exception:
        await matcher.finish()


# ==================== 取消报名 ====================
cancel_signup_matcher = on_keyword(
    {"取消报名"},
    priority=15,
    block=True
)


@cancel_signup_matcher.handle()
async def handle_cancel_signup(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """
    处理取消报名命令

    格式：取消报名 <副本编号>
    """
    try:
        guild_id = event.group_id
        qq_number = str(event.user_id)

        # 检查是否在会话中
        session_manager = get_session_manager()
        if session_manager.get_session(qq_number, str(guild_id)):
            return

        api_client = get_api_client(guild_id=guild_id)
        team_service = TeamService(api_client)

        # 提取参数
        stripped = plain_text.strip()
        cancel_idx = stripped.find("取消报名")
        if cancel_idx == -1:
            return
        args_text = stripped[cancel_idx + len("取消报名"):].strip()

        # 解析副本编号
        team_index = None
        if args_text:
            try:
                team_index = int(args_text.split()[0])
            except ValueError:
                await cancel_signup_matcher.finish(MessageBuilder.build_error_message(
                    "请提供正确的副本编号\n\n"
                    "格式：取消报名 副本编号\n"
                    "例如：取消报名 1"
                ))

        # 获取团队
        teams = await team_service.get_teams()
        if not teams:
            await cancel_signup_matcher.finish(MessageBuilder.build_error_message("当前没有开放的团队"))

        if team_index is None:
            if len(teams) == 1:
                team_index = 1
            else:
                team_list = "\n".join(
                    f"  【{i+1}】{t.title} - {t.dungeon}"
                    for i, t in enumerate(teams)
                )
                await cancel_signup_matcher.finish(MessageBuilder.build_error_message(
                    f"请指定要取消报名的团队编号：\n{team_list}\n\n"
                    f"格式：取消报名 副本编号\n"
                    f"例如：取消报名 1"
                ))

        try:
            team = await team_service.get_team_by_index(teams, team_index)
        except ValueError:
            await cancel_signup_matcher.finish(MessageBuilder.build_error_message(
                f"副本编号无效，请输入 1-{len(teams)} 之间的数字"
            ))

        # 获取用户的报名记录
        try:
            user_signups = await api_client.signups.get_user_signups(team.id, qq_number)
        except Exception:
            user_signups = []

        if not user_signups:
            await cancel_signup_matcher.finish(MessageBuilder.build_error_message(
                f"你在「{team.title}」没有报名记录"
            ))

        if len(user_signups) == 1:
            # 只有一条记录，直接取消
            signup = user_signups[0]
            await api_client.signups.cancel_signup(team.id, qq_number, signup_id=signup.id)

            xinfa_display = format_xinfa_display(signup.signup_info.get("xinfa", ""))
            char_name = signup.signup_info.get("character_name", "") or signup.signup_info.get("player_name", "") or "待定"

            await cancel_signup_matcher.finish(MessageBuilder.build_success_message(
                f"取消报名成功！\n"
                f"团队：{team.title}\n"
                f"心法：{xinfa_display}\n"
                f"角色：{char_name}"
            ))
        else:
            # 多条记录，启动会话让用户选择
            session_manager.create_session(
                user_id=qq_number,
                group_id=str(guild_id),
                action="cancel_signup_select",
                data={
                    "team_id": team.id,
                    "team_title": team.title,
                    "signups": [
                        {
                            "signup_id": s.id,
                            "xinfa": format_xinfa_display(s.signup_info.get("xinfa", "")),
                            "character_name": s.signup_info.get("character_name", "") or "待定",
                            "player_name": s.signup_info.get("player_name", ""),
                            "is_rich": s.is_rich,
                            "is_proxy": s.is_proxy,
                        }
                        for s in user_signups
                    ]
                }
            )

            msg_parts = [f"你在「{team.title}」有多条报名记录，请选择要取消的：\n"]
            for idx, signup in enumerate(user_signups, 1):
                xinfa_display = format_xinfa_display(signup.signup_info.get("xinfa", ""))
                char_name = signup.signup_info.get("character_name", "") or "待定"
                player_name = signup.signup_info.get("player_name", "")
                rich_tag = " [老板]" if signup.is_rich else ""
                proxy_tag = " [代报]" if signup.is_proxy else ""

                if player_name and player_name != char_name:
                    msg_parts.append(f"  【{idx}】{player_name} - {xinfa_display} - {char_name}{rich_tag}{proxy_tag}")
                else:
                    msg_parts.append(f"  【{idx}】{xinfa_display} - {char_name}{rich_tag}{proxy_tag}")

            msg_parts.append("\n请回复序号进行取消")
            await cancel_signup_matcher.finish(Message("\n".join(msg_parts)))

    except (FinishedException, PausedException, RejectedException):
        raise
    except APIError as e:
        logger.error(f"API 错误: {e}")
        await cancel_signup_matcher.finish(MessageBuilder.build_error_message(f"取消报名失败: {e}"))
    except Exception as e:
        logger.exception(f"取消报名处理失败: {e}")
        await cancel_signup_matcher.finish(MessageBuilder.build_error_message(f"取消报名失败: {str(e)}"))


# ==================== 代报名 ====================
proxy_signup_matcher = on_keyword(
    {"代报名"},
    priority=15,
    block=True
)


@proxy_signup_matcher.handle()
async def handle_proxy_signup(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """
    处理代报名命令

    固定格式：代报名 <副本编号> <被报名人昵称> <心法> [角色昵称]
    例如：代报名 1 张三 丐帮
    例如：代报名 1 张三 丐帮 丐箩箩
    """
    try:
        guild_id = event.group_id
        qq_number = str(event.user_id)

        api_client = get_api_client(guild_id=guild_id)
        team_service = TeamService(api_client)

        # 提取参数
        stripped = plain_text.strip()
        proxy_idx = stripped.find("代报名")
        if proxy_idx == -1:
            return
        args_text = stripped[proxy_idx + len("代报名"):].strip()
        parts = args_text.split()

        if len(parts) < 3:
            await proxy_signup_matcher.finish(MessageBuilder.build_error_message(
                "代报名格式不正确\n\n"
                "格式：代报名 副本编号 被报名人昵称 心法 [角色昵称]\n"
                "例如：代报名 1 张三 丐帮\n"
                "例如：代报名 1 张三 丐帮 丐箩箩"
            ))

        # 解析参数
        try:
            team_index = int(parts[0])
        except ValueError:
            await proxy_signup_matcher.finish(MessageBuilder.build_error_message(
                "副本编号必须是数字\n\n"
                "格式：代报名 副本编号 被报名人昵称 心法 [角色昵称]\n"
                "例如：代报名 1 张三 丐帮"
            ))

        player_name = parts[1]
        xinfa_input = parts[2]
        character_name = parts[3] if len(parts) > 3 else None

        xinfa_key = get_xinfa_key(xinfa_input)
        if not xinfa_key:
            await proxy_signup_matcher.finish(MessageBuilder.build_error_message(
                f"无法识别心法「{xinfa_input}」\n\n"
                f"请使用正确的心法名称，例如：丐帮、藏剑、奶花 等"
            ))

        # 获取团队
        teams = await team_service.get_teams()
        open_teams = [t for t in teams if not t.is_locked]
        if not open_teams:
            await proxy_signup_matcher.finish(MessageBuilder.build_error_message("当前没有可报名的团队"))

        try:
            team = await team_service.get_team_by_index(open_teams, team_index)
        except ValueError:
            await proxy_signup_matcher.finish(MessageBuilder.build_error_message(
                f"副本编号无效，请输入 1-{len(open_teams)} 之间的数字"
            ))

        # 构建报名请求
        signup_request = SignupRequest(
            qq_number=qq_number,
            xinfa=xinfa_key,
            character_name=character_name,
            is_rich=False,
            is_proxy=True,
            player_name=player_name,
        )

        signup_info = await api_client.signups.create_signup(team.id, signup_request)

        xinfa_display = format_xinfa_display(xinfa_key)

        msg = MessageBuilder.build_signup_result_message(
            player_name=player_name,
            xinfa=xinfa_display,
            allocation_status=signup_info.allocation_status,
            allocated_slot=signup_info.allocated_slot,
            waitlist_position=signup_info.waitlist_position,
            is_proxy=True,
            is_rich=False,
        )
        await proxy_signup_matcher.send(msg)

        # 发送团队截图
        try:
            updated_teams = await TeamService(api_client).get_teams()
            for idx, t in enumerate(updated_teams, 1):
                if t.id == team.id:
                    team_image_msg = await MessageBuilder.build_team_detail(t, idx, str(guild_id))
                    await proxy_signup_matcher.finish(team_image_msg)
                    break
            else:
                await proxy_signup_matcher.finish()
        except Exception:
            await proxy_signup_matcher.finish()

    except (FinishedException, PausedException, RejectedException):
        raise
    except APIError as e:
        logger.error(f"API 错误: {e}")
        await proxy_signup_matcher.finish(MessageBuilder.build_error_message(f"代报名失败: {e}"))
    except Exception as e:
        logger.exception(f"代报名处理失败: {e}")
        await proxy_signup_matcher.finish(MessageBuilder.build_error_message(f"代报名失败: {str(e)}"))


# ==================== 添加角色 ====================
add_character_matcher = on_keyword(
    {"添加角色"},
    priority=10,
    block=True
)


@add_character_matcher.handle()
async def handle_add_character(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """
    处理添加角色命令

    固定格式：添加角色 <心法> <角色昵称>
    例如：添加角色 丐帮 丐箩箩
    """
    try:
        guild_id = event.group_id
        qq_number = str(event.user_id)

        api_client = get_api_client(guild_id=guild_id)
        char_service = CharacterService(api_client)

        # 提取参数
        stripped = plain_text.strip()
        add_idx = stripped.find("添加角色")
        if add_idx == -1:
            return
        args_text = stripped[add_idx + len("添加角色"):].strip()
        parts = args_text.split()

        if len(parts) < 2:
            await add_character_matcher.finish(MessageBuilder.build_error_message(
                "请提供心法和角色名\n\n"
                "格式：添加角色 心法 角色昵称\n"
                "例如：添加角色 丐帮 丐箩箩"
            ))

        xinfa_input = parts[0]
        character_name = parts[1]

        xinfa_key = get_xinfa_key(xinfa_input)
        if not xinfa_key:
            await add_character_matcher.finish(MessageBuilder.build_error_message(
                f"无法识别心法「{xinfa_input}」\n\n"
                f"请使用正确的心法名称，例如：丐帮、藏剑、奶花 等"
            ))

        # 检查角色是否已存在
        try:
            existing_chars = await char_service.get_user_characters(qq_number)
            existing = next((c for c in existing_chars if c.name == character_name), None)

            if existing:
                existing_xinfa = format_xinfa_display(existing.xinfa)
                new_xinfa = format_xinfa_display(xinfa_key)
                if existing.xinfa == xinfa_key:
                    await add_character_matcher.finish(MessageBuilder.build_error_message(
                        f"角色「{character_name}」({existing_xinfa}) 已存在"
                    ))
                else:
                    # TODO: 添加多修支持
                    await add_character_matcher.finish(MessageBuilder.build_success_message(
                        f"角色「{character_name}」已存在（{existing_xinfa}）\n"
                        f"暂不支持通过命令添加多修心法，请联系管理员"
                    ))
        except Exception:
            pass

        # 创建角色
        new_char = await char_service.create_character(
            qq_number=qq_number,
            name=character_name,
            xinfa=xinfa_key,
        )

        xinfa_display = format_xinfa_display(xinfa_key)
        await add_character_matcher.finish(MessageBuilder.build_success_message(
            f"角色添加成功！\n"
            f"角色名：{character_name}\n"
            f"心法：{xinfa_display}"
        ))

    except (FinishedException, PausedException, RejectedException):
        raise
    except APIError as e:
        logger.error(f"API 错误: {e}")
        await add_character_matcher.finish(MessageBuilder.build_error_message(f"添加角色失败: {e}"))
    except Exception as e:
        logger.exception(f"添加角色失败: {e}")
        await add_character_matcher.finish(MessageBuilder.build_error_message(f"添加角色失败: {str(e)}"))


# ==================== 会话处理 ====================
session_handler = on_message(
    priority=5,  # 最高优先级，确保会话消息优先处理
    block=False
)


@session_handler.handle()
async def handle_session_message(event: GroupMessageEvent, plain_text: str = EventPlainText()):
    """处理会话中的用户消息（选择角色、选择心法、取消报名选择等）"""
    session_manager = get_session_manager()
    qq_number = str(event.user_id)
    group_id = str(event.group_id)

    session = session_manager.get_session(qq_number, group_id)
    if not session:
        return

    user_input = plain_text.strip()

    try:
        if session.action == "cancel_signup_select":
            await _handle_cancel_signup_select(session_handler, event, session, user_input)
        elif session.action == "signup_select_character":
            await _handle_signup_select_character(session_handler, event, session, user_input)
        elif session.action == "signup_select_xinfa":
            await _handle_signup_select_xinfa(session_handler, event, session, user_input)
    except (FinishedException, PausedException, RejectedException):
        raise
    except Exception as e:
        logger.exception(f"会话处理失败: {e}")
        session_manager.close_session(qq_number, group_id)
        await session_handler.finish(MessageBuilder.build_error_message(f"操作失败: {str(e)}"))


async def _handle_cancel_signup_select(
    matcher,
    event: GroupMessageEvent,
    session,
    user_input: str,
):
    """处理取消报名的选择"""
    try:
        index = int(user_input)
    except ValueError:
        return

    signups = session.data.get("signups", [])
    team_id = session.data.get("team_id")
    team_title = session.data.get("team_title", "")

    if index < 1 or index > len(signups):
        await matcher.send(MessageBuilder.build_error_message(
            f"无效的序号，请输入 1-{len(signups)} 之间的数字"
        ))
        return

    selected = signups[index - 1]
    signup_id = selected["signup_id"]

    guild_id = event.group_id
    api_client = get_api_client(guild_id=guild_id)
    qq_number = str(event.user_id)

    await api_client.signups.cancel_signup(team_id, qq_number, signup_id=signup_id)

    session_manager = get_session_manager()
    session_manager.close_session(qq_number, str(guild_id))

    await matcher.finish(MessageBuilder.build_success_message(
        f"取消报名成功！\n"
        f"团队：{team_title}\n"
        f"心法：{selected['xinfa']}\n"
        f"角色：{selected['character_name']}"
    ))


async def _handle_signup_select_character(
    matcher,
    event: GroupMessageEvent,
    session,
    user_input: str,
):
    """处理报名时选择角色"""
    characters = session.data.get("characters", [])
    team_id = session.data.get("team_id")
    team_index = session.data.get("team_index")
    xinfa_key = session.data.get("xinfa_key")

    selected_char = None

    # 尝试按序号选择
    try:
        index = int(user_input)
        if 1 <= index <= len(characters):
            selected_char = characters[index - 1]
    except ValueError:
        # 尝试按角色名匹配
        for char in characters:
            if char["name"] == user_input:
                selected_char = char
                break

    if not selected_char:
        await matcher.send(Message(
            f"未匹配到角色，请回复序号（1-{len(characters)}）或角色名"
        ))
        return

    # 关闭会话
    session_manager = get_session_manager()
    session_manager.close_session(str(event.user_id), str(event.group_id))

    # 执行报名
    guild_id = event.group_id
    qq_number = str(event.user_id)
    api_client = get_api_client(guild_id=guild_id)
    char_service = CharacterService(api_client)

    try:
        user_characters = await char_service.get_user_characters(qq_number)
    except Exception:
        user_characters = []

    # 获取团队
    team_service = TeamService(api_client)
    teams = await team_service.get_teams()
    team = next((t for t in teams if t.id == team_id), None)
    if not team:
        await matcher.finish(MessageBuilder.build_error_message("团队已关闭或不存在"))

    await _do_signup(
        matcher, api_client, char_service, event,
        team, team_index, xinfa_key, selected_char["name"],
        user_characters, character_id=selected_char["id"]
    )


async def _handle_signup_select_xinfa(
    matcher,
    event: GroupMessageEvent,
    session,
    user_input: str,
):
    """处理报名时选择心法"""
    xinfas = session.data.get("xinfas", [])
    team_id = session.data.get("team_id")
    team_index = session.data.get("team_index")
    character_id = session.data.get("character_id")
    character_name = session.data.get("character_name")

    selected_xinfa = None

    # 尝试按序号选择
    try:
        index = int(user_input)
        if 1 <= index <= len(xinfas):
            selected_xinfa = xinfas[index - 1]
    except ValueError:
        # 尝试按心法名匹配
        input_key = get_xinfa_key(user_input)
        if input_key and input_key in xinfas:
            selected_xinfa = input_key

    if not selected_xinfa:
        await matcher.send(Message(
            f"未匹配到心法，请回复序号（1-{len(xinfas)}）或心法名"
        ))
        return

    # 关闭会话
    session_manager = get_session_manager()
    session_manager.close_session(str(event.user_id), str(event.group_id))

    # 执行报名
    guild_id = event.group_id
    qq_number = str(event.user_id)
    api_client = get_api_client(guild_id=guild_id)
    char_service = CharacterService(api_client)

    try:
        user_characters = await char_service.get_user_characters(qq_number)
    except Exception:
        user_characters = []

    # 获取团队
    team_service = TeamService(api_client)
    teams = await team_service.get_teams()
    team = next((t for t in teams if t.id == team_id), None)
    if not team:
        await matcher.finish(MessageBuilder.build_error_message("团队已关闭或不存在"))

    await _do_signup(
        matcher, api_client, char_service, event,
        team, team_index, selected_xinfa, character_name,
        user_characters, character_id=character_id
    )


# ==================== 初始化成员（超级管理员或群主专用）====================
init_members = on_keyword(
    {"初始化成员", "同步成员"},
    permission=SUPERUSER | GROUP_OWNER,
    priority=10,
    block=True
)


@init_members.handle()
async def handle_init_members(bot: Bot, event: GroupMessageEvent):
    """处理初始化成员命令"""
    try:
        group_id = event.group_id
        await init_members.send("正在获取群成员列表，请稍候...")

        group_members = await bot.get_group_member_list(group_id=group_id)
        logger.info(f"获取到 {len(group_members)} 个群成员")

        guild_id = event.group_id
        api_client = get_api_client(guild_id=guild_id)
        member_service = MemberService(api_client)

        await init_members.send(f"获取到 {len(group_members)} 个群成员，开始同步到后端...")

        result = await member_service.sync_all_members(group_members)

        msg_parts = [f"成员同步完成！\n总成员数: {result['total']}"]
        if result.get('added', 0) > 0:
            msg_parts.append(f"新增成员: {result['added']}")
        if result.get('updated', 0) > 0:
            msg_parts.append(f"更新成员: {result['updated']}")
        if result.get('restored', 0) > 0:
            msg_parts.append(f"恢复成员: {result['restored']}")
        if result.get('removed', 0) > 0:
            msg_parts.append(f"移除成员: {result['removed']}")
        if result.get('unchanged', 0) > 0:
            msg_parts.append(f"未变化成员: {result['unchanged']}")
        if result.get('failed', 0) > 0:
            msg_parts.append(f"失败成员: {result['failed']}")

        await init_members.finish(MessageBuilder.build_success_message("\n".join(msg_parts)))

    except (FinishedException, PausedException, RejectedException):
        raise
    except APIError as e:
        logger.error(f"API 错误: {e}")
        await init_members.finish(MessageBuilder.build_error_message(f"同步成员失败: {e}"))
    except Exception as e:
        logger.exception(f"初始化成员失败: {e}")
        await init_members.finish(MessageBuilder.build_error_message(f"初始化成员失败: {str(e)}"))
