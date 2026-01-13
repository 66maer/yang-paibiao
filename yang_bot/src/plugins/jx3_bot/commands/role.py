"""
角色与战绩命令
角色详情、属性、精耐、名片、奇穴、阵眼、名剑排行、门派表现等
"""
from nonebot import on_command
from nonebot.adapters.onebot.v11 import (
    Bot,
    GroupMessageEvent,
    Message,
    MessageSegment,
)
from nonebot.params import CommandArg

from ..api.client import api_client, JX3APIError
from ..utils.server_resolver import get_effective_server
from ..utils.parser import parse_args


# ============== 角色详情 ==============

role_detailed = on_command(
    "角色详情",
    aliases={"角色", "角色信息"},
    priority=5,
    block=True
)


@role_detailed.handle()
async def handle_role_detailed(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询角色详情"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await role_detailed.finish("请提供角色名，例如：角色详情 梦江南 角色名")
    
    # 解析参数
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_role_detailed(server, name)
        data = result["data"]
        
        msg = f"👤 角色信息\n"
        msg += f"🖥️ {data.get('zoneName', '')} - {data.get('serverName', '')}\n"
        msg += f"📛 {data.get('roleName', name)}\n"
        msg += f"🏫 门派：{data.get('forceName', '未知')}\n"
        msg += f"👥 体型：{data.get('bodyName', '未知')}\n"
        if data.get('tongName'):
            msg += f"🏠 帮会：{data['tongName']}\n"
        if data.get('campName'):
            msg += f"⚔️ 阵营：{data['campName']}\n"
        
        await role_detailed.finish(msg)
        
    except JX3APIError as e:
        await role_detailed.finish(f"查询失败：{e.msg}")


# ============== 属性 ==============

role_attribute = on_command(
    "属性",
    aliases={"装备属性", "面板"},
    priority=5,
    block=True
)


@role_attribute.handle()
async def handle_role_attribute(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询角色属性"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await role_attribute.finish("请提供角色名，例如：属性 梦江南 角色名")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_role_attribute(server, name)
        data = result["data"]
        
        msg = f"📊 {name} 属性面板\n"
        msg += f"🖥️ {server}\n"
        msg += f"🏫 {data.get('forceName', '未知')} - {data.get('kungfuName', '未知')}\n"
        msg += f"⭐ 装分：{data.get('score', 0)}\n"
        
        # 基础属性
        if data.get('panelList'):
            msg += "\n【基础属性】\n"
            for panel in data['panelList'][:8]:  # 显示前8项
                msg += f"• {panel.get('name', '')}: {panel.get('value', '')}\n"
        
        await role_attribute.finish(msg)
        
    except JX3APIError as e:
        await role_attribute.finish(f"查询失败：{e.msg}")


# ============== 精耐 ==============

role_monster = on_command(
    "精耐",
    aliases={"精力耐力"},
    priority=5,
    block=True
)


@role_monster.handle()
async def handle_role_monster(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询角色精耐"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await role_monster.finish("请提供角色名，例如：精耐 梦江南 角色名")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_role_monster(server, name)
        data = result["data"]
        
        msg = f"💪 {name} 精耐信息\n"
        msg += f"🖥️ {server}\n"
        msg += f"⚡ 精力：{data.get('energy', 0)}/{data.get('maxEnergy', 0)}\n"
        msg += f"💪 耐力：{data.get('stamina', 0)}/{data.get('maxStamina', 0)}\n"
        
        await role_monster.finish(msg)
        
    except JX3APIError as e:
        await role_monster.finish(f"查询失败：{e.msg}")


# ============== 名片 ==============

show_card = on_command(
    "名片",
    aliases={"角色名片"},
    priority=5,
    block=True
)


@show_card.handle()
async def handle_show_card(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询角色名片"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await show_card.finish("请提供角色名，例如：名片 梦江南 角色名")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_show_card(server, name)
        data = result["data"]
        
        # 如果有图片URL，发送图片
        if data.get("image"):
            await show_card.finish(MessageSegment.image(data["image"]))
        else:
            msg = f"🎴 {name} 的名片\n"
            msg += f"🖥️ {server}\n"
            msg += "暂无名片图片"
            await show_card.finish(msg)
        
    except JX3APIError as e:
        await show_card.finish(f"查询失败：{e.msg}")


# ============== 名片墙 ==============

show_records = on_command(
    "名片墙",
    aliases={"历史名片"},
    priority=5,
    block=True
)


@show_records.handle()
async def handle_show_records(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询名片墙"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await show_records.finish("请提供角色名，例如：名片墙 梦江南 角色名")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_show_records(server, name)
        data = result["data"]
        
        if not data:
            await show_records.finish(f"未找到 {name} 的名片记录")
        
        msg = f"🎴 {name} 的名片墙\n"
        msg += f"🖥️ {server}\n"
        msg += f"共 {len(data)} 张名片\n"
        
        # 显示最近几张
        for i, card in enumerate(data[:3]):
            msg += f"\n📷 {i+1}. {card.get('time', '未知时间')}"
        
        await show_records.finish(msg)
        
    except JX3APIError as e:
        await show_records.finish(f"查询失败：{e.msg}")


# ============== 随机名片 ==============

show_random = on_command(
    "随机名片",
    priority=5,
    block=True
)


@show_random.handle()
async def handle_show_random():
    """随机查看一张名片"""
    try:
        result = await api_client.get_show_random()
        data = result["data"]
        
        if data.get("image"):
            msg = f"🎴 随机名片\n"
            msg += f"👤 {data.get('name', '未知')}\n"
            msg += f"🖥️ {data.get('server', '未知')}\n"
            await show_random.send(msg)
            await show_random.finish(MessageSegment.image(data["image"]))
        else:
            await show_random.finish("获取随机名片失败")
        
    except JX3APIError as e:
        await show_random.finish(f"查询失败：{e.msg}")


# ============== 奇穴 ==============

school_force = on_command(
    "奇穴",
    priority=5,
    block=True
)


@school_force.handle()
async def handle_school_force(args: Message = CommandArg()):
    """查询心法奇穴"""
    name = args.extract_plain_text().strip()
    
    if not name:
        await school_force.finish("请提供心法名称，例如：奇穴 花间游")
    
    try:
        result = await api_client.get_school_force(name)
        data = result["data"]
        
        msg = f"🔮 {name} 奇穴\n"
        
        # 显示奇穴信息
        if isinstance(data, dict) and data.get("data"):
            for i, row in enumerate(data["data"][:12], 1):
                skills = [s.get("name", "") for s in row] if isinstance(row, list) else []
                msg += f"\n第{i}重：{' / '.join(skills)}"
        
        await school_force.finish(msg)
        
    except JX3APIError as e:
        await school_force.finish(f"查询失败：{e.msg}")


# ============== 阵眼 ==============

school_matrix = on_command(
    "阵眼",
    priority=5,
    block=True
)


@school_matrix.handle()
async def handle_school_matrix(args: Message = CommandArg()):
    """查询心法阵眼"""
    name = args.extract_plain_text().strip()
    
    if not name:
        await school_matrix.finish("请提供心法名称，例如：阵眼 花间游")
    
    try:
        result = await api_client.get_school_matrix(name)
        data = result["data"]
        
        msg = f"🔷 {name} 阵眼\n"
        
        if isinstance(data, dict):
            if data.get("name"):
                msg += f"\n阵法：{data['name']}\n"
            if data.get("descs"):
                for desc in data["descs"]:
                    msg += f"• {desc}\n"
        
        await school_matrix.finish(msg)
        
    except JX3APIError as e:
        await school_matrix.finish(f"查询失败：{e.msg}")


# ============== 名剑排行 ==============

arena_awesome = on_command(
    "名剑排行",
    aliases={"jjc排行", "JJC排行"},
    priority=5,
    block=True
)


@arena_awesome.handle()
async def handle_arena_awesome(args: Message = CommandArg()):
    """查询名剑排行"""
    mode = args.extract_plain_text().strip() or "33"
    
    # 验证模式
    if mode not in ["22", "33", "55"]:
        mode = "33"
    
    try:
        result = await api_client.get_arena_awesome(mode=mode, limit=10)
        data = result["data"]
        
        mode_name = {"22": "2v2", "33": "3v3", "55": "5v5"}.get(mode, mode)
        msg = f"🏆 名剑大会排行榜 ({mode_name})\n"
        
        if not data:
            msg += "暂无数据"
        else:
            for i, player in enumerate(data[:10], 1):
                msg += f"\n{i}. {player.get('roleName', '未知')}"
                msg += f" ({player.get('forceName', '未知')})"
                msg += f" - {player.get('score', 0)}分"
        
        await arena_awesome.finish(msg)
        
    except JX3APIError as e:
        await arena_awesome.finish(f"查询失败：{e.msg}")


# ============== 门派表现 ==============

arena_schools = on_command(
    "门派表现",
    aliases={"门派JJC", "门派jjc"},
    priority=5,
    block=True
)


@arena_schools.handle()
async def handle_arena_schools(args: Message = CommandArg()):
    """查询门派表现"""
    mode = args.extract_plain_text().strip() or "33"
    
    if mode not in ["22", "33", "55"]:
        mode = "33"
    
    try:
        result = await api_client.get_arena_schools(mode=mode)
        data = result["data"]
        
        mode_name = {"22": "2v2", "33": "3v3", "55": "5v5"}.get(mode, mode)
        msg = f"📊 门派竞技场表现 ({mode_name})\n"
        
        if not data:
            msg += "暂无数据"
        else:
            for school in data[:15]:
                msg += f"\n• {school.get('forceName', '未知')}"
                msg += f" - 胜率{school.get('winRate', 0)}%"
        
        await arena_schools.finish(msg)
        
    except JX3APIError as e:
        await arena_schools.finish(f"查询失败：{e.msg}")


# ============== 战绩 ==============

arena_recent = on_command(
    "战绩",
    aliases={"JJC战绩", "jjc战绩"},
    priority=5,
    block=True
)


@arena_recent.handle()
async def handle_arena_recent(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询角色战绩"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await arena_recent.finish("请提供角色名，例如：战绩 梦江南 角色名")
    
    # 解析参数：服务器、模式、角色名
    mode = "33"
    server = None
    name = None
    
    for arg in arg_list:
        if arg in ["22", "33", "55"]:
            mode = arg
        elif server is None:
            server = get_effective_server(arg, event)
            if server == arg:  # 不是服务器名，可能是角色名
                name = arg
                server = get_effective_server(None, event)
        else:
            name = arg
    
    if not name:
        await arena_recent.finish("请提供角色名")
    
    try:
        result = await api_client.get_arena_recent(server, name, mode)
        data = result["data"]
        
        mode_name = {"22": "2v2", "33": "3v3", "55": "5v5"}.get(mode, mode)
        msg = f"⚔️ {name} 战绩 ({mode_name})\n"
        msg += f"🖥️ {server}\n"
        
        if not data:
            msg += "暂无战绩记录"
        else:
            # 统计
            wins = sum(1 for r in data if r.get("won"))
            total = len(data)
            msg += f"近期战绩：{wins}胜{total-wins}负\n"
        
        await arena_recent.finish(msg)
        
    except JX3APIError as e:
        await arena_recent.finish(f"查询失败：{e.msg}")


# ============== 查人 ==============

fraud_detailed = on_command(
    "查人",
    aliases={"骗子查询"},
    priority=5,
    block=True
)


@fraud_detailed.handle()
async def handle_fraud_detailed(args: Message = CommandArg()):
    """查询贴吧黑历史"""
    uid = args.extract_plain_text().strip()
    
    if not uid:
        await fraud_detailed.finish("请提供QQ号，例如：查人 123456789")
    
    try:
        result = await api_client.get_fraud_detailed(uid)
        data = result["data"]
        
        if not data or not data.get("records"):
            await fraud_detailed.finish(f"✅ QQ {uid} 暂无不良记录")
        
        msg = f"⚠️ QQ {uid} 查询结果\n"
        records = data.get("records", [])
        msg += f"共 {len(records)} 条记录\n"
        
        for record in records[:5]:
            msg += f"\n📌 {record.get('title', '未知')}"
            msg += f"\n   {record.get('desc', '')[:50]}..."
        
        await fraud_detailed.finish(msg)
        
    except JX3APIError as e:
        if "暂无" in e.msg or "未找到" in e.msg:
            await fraud_detailed.finish(f"✅ QQ {uid} 暂无不良记录")
        await fraud_detailed.finish(f"查询失败：{e.msg}")
