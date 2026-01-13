"""
阵营与帮会命令
沙盘、关隘、诛恶、招募、师父、徒弟
"""
from nonebot import on_command
from nonebot.adapters.onebot.v11 import (
    Bot,
    GroupMessageEvent,
    Message,
    MessageSegment,
)
from nonebot.params import CommandArg
from datetime import datetime

from ..api.client import api_client, JX3APIError
from ..utils.server_resolver import get_effective_server
from ..utils.parser import parse_args


# ============== 沙盘 ==============

server_sand = on_command(
    "沙盘",
    aliases={"阵营沙盘"},
    priority=5,
    block=True
)


@server_sand.handle()
async def handle_server_sand(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询阵营沙盘"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event)
    
    try:
        result = await api_client.get_server_sand(server)
        data = result["data"]
        
        msg = f"🗺️ {server} 阵营沙盘\n"
        
        if not data:
            msg += "暂无沙盘数据"
        else:
            # 统计阵营据点
            camps = {}
            for point in data.get("data", []):
                camp = point.get("campName", "中立")
                camps[camp] = camps.get(camp, 0) + 1
            
            msg += "\n【阵营据点统计】\n"
            for camp, count in camps.items():
                msg += f"• {camp}: {count} 个\n"
        
        await server_sand.finish(msg)
        
    except JX3APIError as e:
        await server_sand.finish(f"查询失败：{e.msg}")


# ============== 关隘 ==============

server_leader = on_command(
    "关隘",
    aliases={"据点关隘"},
    priority=5,
    block=True
)


@server_leader.handle()
async def handle_server_leader():
    """查询据点关隘"""
    try:
        result = await api_client.get_server_leader()
        data = result["data"]
        
        msg = "🏰 据点关隘信息\n"
        
        if not data:
            msg += "暂无关隘数据"
        else:
            for point in data[:15]:
                msg += f"\n• {point.get('server', '未知')}"
                msg += f" - {point.get('name', '未知')}"
                if point.get("camp"):
                    msg += f" ({point['camp']})"
        
        await server_leader.finish(msg)
        
    except JX3APIError as e:
        await server_leader.finish(f"查询失败：{e.msg}")


# ============== 诛恶 ==============

server_antivice = on_command(
    "诛恶",
    aliases={"诛恶事件"},
    priority=5,
    block=True
)


@server_antivice.handle()
async def handle_server_antivice(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询诛恶事件"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event)
    
    try:
        result = await api_client.get_server_antivice(server)
        data = result["data"]
        
        msg = f"⚔️ {server} 诛恶事件\n"
        
        if not data:
            msg += "暂无诛恶事件"
        else:
            for event_item in data[:10]:
                time_str = datetime.fromtimestamp(event_item.get("time", 0)).strftime("%m-%d %H:%M")
                msg += f"\n• {event_item.get('map', '未知')}"
                msg += f" - {event_item.get('name', '未知')}"
                msg += f" ({time_str})"
        
        await server_antivice.finish(msg)
        
    except JX3APIError as e:
        await server_antivice.finish(f"查询失败：{e.msg}")


# ============== 招募 ==============

member_recruit = on_command(
    "招募",
    aliases={"团队招募"},
    priority=5,
    block=True
)


@member_recruit.handle()
async def handle_member_recruit(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询团队招募"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await member_recruit.finish("请提供区服，例如：招募 梦江南 25人")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        keyword = arg_list[1]
    else:
        server = get_effective_server(arg_list[0], event)
        keyword = None
    
    try:
        result = await api_client.get_member_recruit(server, keyword)
        data = result["data"]
        
        msg = f"📢 {server} 团队招募\n"
        if keyword:
            msg += f"🔍 关键词：{keyword}\n"
        
        if not data:
            msg += "暂无招募信息"
        else:
            for team in data[:8]:
                msg += f"\n🏷️ {team.get('title', '未知团队')}\n"
                msg += f"   人数：{team.get('count', '?')}/{team.get('maxCount', '?')}\n"
                msg += f"   活动：{team.get('activity', '未知')}\n"
                if team.get('content'):
                    msg += f"   备注：{team['content'][:30]}...\n"
        
        await member_recruit.finish(msg)
        
    except JX3APIError as e:
        await member_recruit.finish(f"查询失败：{e.msg}")


# ============== 师父 ==============

member_teacher = on_command(
    "师父",
    aliases={"拜师", "师傅招募"},
    priority=5,
    block=True
)


@member_teacher.handle()
async def handle_member_teacher(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询师父招募"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await member_teacher.finish("请提供区服，例如：师父 梦江南")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        keyword = arg_list[1]
    else:
        server = get_effective_server(arg_list[0], event)
        keyword = None
    
    try:
        result = await api_client.get_member_teacher(server, keyword)
        data = result["data"]
        
        msg = f"👨‍🏫 {server} 师父招收\n"
        if keyword:
            msg += f"🔍 关键词：{keyword}\n"
        
        if not data:
            msg += "暂无师父招收信息"
        else:
            for teacher in data[:8]:
                msg += f"\n• {teacher.get('roleName', '未知')}"
                msg += f" ({teacher.get('forceName', '未知')})"
                if teacher.get('level'):
                    msg += f" Lv.{teacher['level']}"
                if teacher.get('desc'):
                    msg += f"\n  {teacher['desc'][:40]}"
        
        await member_teacher.finish(msg)
        
    except JX3APIError as e:
        await member_teacher.finish(f"查询失败：{e.msg}")


# ============== 徒弟 ==============

member_student = on_command(
    "徒弟",
    aliases={"收徒", "徒弟招募"},
    priority=5,
    block=True
)


@member_student.handle()
async def handle_member_student(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询徒弟招募"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await member_student.finish("请提供区服，例如：徒弟 梦江南")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        keyword = arg_list[1]
    else:
        server = get_effective_server(arg_list[0], event)
        keyword = None
    
    try:
        result = await api_client.get_member_student(server, keyword)
        data = result["data"]
        
        msg = f"👨‍🎓 {server} 徒弟招收\n"
        if keyword:
            msg += f"🔍 关键词：{keyword}\n"
        
        if not data:
            msg += "暂无徒弟招收信息"
        else:
            for student in data[:8]:
                msg += f"\n• {student.get('roleName', '未知')}"
                msg += f" ({student.get('forceName', '未知')})"
                if student.get('level'):
                    msg += f" Lv.{student['level']}"
                if student.get('desc'):
                    msg += f"\n  {student['desc'][:40]}"
        
        await member_student.finish(msg)
        
    except JX3APIError as e:
        await member_student.finish(f"查询失败：{e.msg}")
