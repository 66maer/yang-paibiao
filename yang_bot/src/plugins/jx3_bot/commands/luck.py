"""
奇遇与宠物命令
奇遇统计、奇遇汇总、奇遇记录、未出奇遇、蹲宠、赤兔、马场
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


# ============== 奇遇记录 ==============

luck_adventure = on_command(
    "奇遇记录",
    aliases={"奇遇"},
    priority=5,
    block=True
)


@luck_adventure.handle()
async def handle_luck_adventure(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询个人奇遇记录"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await luck_adventure.finish("请提供角色名，例如：奇遇记录 梦江南 角色名")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_luck_adventure(server, name)
        data = result["data"]
        
        msg = f"🍀 {name} 的奇遇记录\n"
        msg += f"🖥️ {server}\n"
        
        if not data:
            msg += "暂无奇遇记录"
        else:
            msg += f"共 {len(data)} 条记录\n"
            for luck in data[:10]:
                time_str = datetime.fromtimestamp(luck.get("time", 0)).strftime("%Y-%m-%d")
                level_icon = "⭐" * luck.get("level", 1)
                msg += f"\n{level_icon} {luck.get('event', '未知')} - {time_str}"
        
        await luck_adventure.finish(msg)
        
    except JX3APIError as e:
        await luck_adventure.finish(f"查询失败：{e.msg}")


# ============== 奇遇统计 ==============

luck_statistical = on_command(
    "奇遇统计",
    priority=5,
    block=True
)


@luck_statistical.handle()
async def handle_luck_statistical(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询奇遇统计"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await luck_statistical.finish("请提供奇遇名，例如：奇遇统计 梦江南 阴阳两界")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        luck_name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        luck_name = arg_list[0]
    
    try:
        result = await api_client.get_luck_statistical(server, luck_name)
        data = result["data"]
        
        msg = f"📊 奇遇统计 - {luck_name}\n"
        msg += f"🖥️ {server}\n"
        
        if not data:
            msg += "暂无统计数据"
        else:
            msg += f"近期触发 {len(data)} 次\n"
            for record in data[:10]:
                time_str = datetime.fromtimestamp(record.get("time", 0)).strftime("%m-%d %H:%M")
                msg += f"\n• {record.get('name', '未知')} - {time_str}"
        
        await luck_statistical.finish(msg)
        
    except JX3APIError as e:
        await luck_statistical.finish(f"查询失败：{e.msg}")


# ============== 奇遇汇总 ==============

luck_collect = on_command(
    "奇遇汇总",
    aliases={"近期奇遇"},
    priority=5,
    block=True
)


@luck_collect.handle()
async def handle_luck_collect(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询服务器近期奇遇"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event)
    
    try:
        result = await api_client.get_luck_collect(server)
        data = result["data"]
        
        msg = f"🍀 {server} 近期奇遇汇总\n"
        
        if not data:
            msg += "暂无数据"
        else:
            # 按奇遇分组统计
            luck_count = {}
            for record in data:
                event_name = record.get("event", "未知")
                luck_count[event_name] = luck_count.get(event_name, 0) + 1
            
            sorted_lucks = sorted(luck_count.items(), key=lambda x: x[1], reverse=True)
            for luck_name, count in sorted_lucks[:15]:
                msg += f"\n• {luck_name}: {count}次"
        
        await luck_collect.finish(msg)
        
    except JX3APIError as e:
        await luck_collect.finish(f"查询失败：{e.msg}")


# ============== 未出奇遇 ==============

luck_unfinished = on_command(
    "未出奇遇",
    aliases={"缺失奇遇", "缺少奇遇"},
    priority=5,
    block=True
)


@luck_unfinished.handle()
async def handle_luck_unfinished(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询未完成奇遇"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await luck_unfinished.finish("请提供角色名，例如：未出奇遇 梦江南 角色名")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_luck_unfinished(server, name)
        data = result["data"]
        
        msg = f"❓ {name} 未触发奇遇\n"
        msg += f"🖥️ {server}\n"
        
        if not data:
            msg += "🎉 已触发所有奇遇！"
        else:
            msg += f"还有 {len(data)} 个奇遇未触发\n"
            for luck in data[:15]:
                level_icon = "⭐" * luck.get("level", 1)
                msg += f"\n{level_icon} {luck.get('name', '未知')}"
        
        await luck_unfinished.finish(msg)
        
    except JX3APIError as e:
        await luck_unfinished.finish(f"查询失败：{e.msg}")


# ============== 蹲宠 ==============

archived_pet = on_command(
    "蹲宠",
    aliases={"宠物刷新"},
    priority=5,
    block=True
)


@archived_pet.handle()
async def handle_archived_pet(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询宠物刷新记录"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event)
    
    try:
        result = await api_client.get_archived_pet_event(server)
        data = result["data"]
        
        msg = f"🐾 {server} 宠物刷新记录\n"
        
        if not data:
            msg += "暂无记录"
        else:
            for pet in data[:10]:
                time_str = datetime.fromtimestamp(pet.get("time", 0)).strftime("%m-%d %H:%M")
                msg += f"\n• {pet.get('name', '未知')}"
                msg += f" @ {pet.get('map', '未知')}"
                msg += f" - {time_str}"
        
        await archived_pet.finish(msg)
        
    except JX3APIError as e:
        await archived_pet.finish(f"查询失败：{e.msg}")


# ============== 赤兔 ==============

chitu = on_command(
    "赤兔",
    aliases={"赤兔记录"},
    priority=5,
    block=True
)


@chitu.handle()
async def handle_chitu():
    """查询赤兔记录"""
    try:
        result = await api_client.get_chitu_records()
        data = result["data"]
        
        msg = "🐴 今日赤兔刷新记录\n"
        
        if not data:
            msg += "今日暂无赤兔刷新"
        else:
            for record in data[:10]:
                time_str = datetime.fromtimestamp(record.get("time", 0)).strftime("%H:%M")
                msg += f"\n• {record.get('server', '未知')}"
                msg += f" @ {record.get('map', '未知')}"
                msg += f" - {time_str}"
                if record.get("name"):
                    msg += f" (被 {record['name']} 抓获)"
        
        await chitu.finish(msg)
        
    except JX3APIError as e:
        await chitu.finish(f"查询失败：{e.msg}")


# ============== 马场 ==============

horse_ranch = on_command(
    "马场",
    aliases={"马场刷新"},
    priority=5,
    block=True
)


@horse_ranch.handle()
async def handle_horse_ranch(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询马场信息"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event)
    
    try:
        result = await api_client.get_horse_ranch(server)
        data = result["data"]
        
        msg = f"🐴 {server} 马场信息\n"
        
        if not data:
            msg += "暂无马驹信息"
        else:
            for horse in data[:10]:
                msg += f"\n• {horse.get('name', '未知马驹')}"
                msg += f" @ {horse.get('map', '未知')}"
                if horse.get("time"):
                    time_str = datetime.fromtimestamp(horse["time"]).strftime("%H:%M")
                    msg += f" - {time_str}"
        
        await horse_ranch.finish(msg)
        
    except JX3APIError as e:
        await horse_ranch.finish(f"查询失败：{e.msg}")
