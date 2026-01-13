"""
日常活动命令
日常、月历、开服、维护、新闻、技改、百战、楚天社等
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


# ============== 日常 ==============

daily = on_command(
    "日常",
    aliases={"每日", "今日"},
    priority=5,
    block=True
)


@daily.handle()
async def handle_daily(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询日常活动"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event)
    
    try:
        result = await api_client.get_active_calendar(server)
        data = result["data"]
        
        msg = f"📅 {data['date']} 星期{data['week']}\n"
        msg += f"🏰 秘境大战：{data['war']}\n"
        msg += f"⚔️ 战场任务：{data['battle']}\n"
        msg += f"🏫 宗门事件：{data['school']}\n"
        msg += f"🚗 驰援任务：{data['rescue']}\n"
        msg += f"🏕️ 阵营任务：{data['orecar']}\n"
        msg += f"🐾 福源宠物：{';'.join(data['luck'])}\n"
        
        # 攻防时间
        if data['week'] in ["二", "四"]:
            msg += "⚔️ 小攻防：20:00-22:00\n"
        elif data['week'] in ["六", "日"]:
            msg += "⚔️ 大攻防：13:00-15:00, 17:00-19:00\n"
        
        if data.get('draw'):
            msg += f"🎨 美人画像：{data['draw']}\n"
        
        msg += f"\n📜 家园加倍：{';'.join(data['card'])}\n"
        msg += f"📋 公共任务：{data['team'][0] if data['team'] else '无'}\n"
        msg += f"🏯 团队秘境：{data['team'][2] if len(data['team']) > 2 else '无'}"
        
        await daily.finish(msg)
        
    except JX3APIError as e:
        await daily.finish(f"查询失败：{e.msg}")


# ============== 开服 ==============

server_check = on_command(
    "开服",
    aliases={"开服检查"},
    priority=5,
    block=True
)


@server_check.handle()
async def handle_server_check(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询开服状态"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event)
    
    try:
        result = await api_client.get_server_check(server)
        data = result["data"]
        
        status_text = "🟢 已开服" if data["status"] == 1 else "🔴 维护中"
        
        await server_check.finish(
            f"🖥️ {data['zone']} - {data['server']}\n"
            f"状态：{status_text}"
        )
        
    except JX3APIError as e:
        await server_check.finish(f"查询失败：{e.msg}")


# ============== 服务器热度 ==============

server_status = on_command(
    "服务器",
    aliases={"服务器状态", "热度"},
    priority=5,
    block=True
)


@server_status.handle()
async def handle_server_status(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询服务器热度"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event)
    
    try:
        result = await api_client.get_server_status(server)
        data = result["data"]
        
        await server_status.finish(
            f"🖥️ {data['zone']} - {data['server']}\n"
            f"热度：{data['status']}"
        )
        
    except JX3APIError as e:
        await server_status.finish(f"查询失败：{e.msg}")


# ============== 维护公告 ==============

news_announce = on_command(
    "维护",
    aliases={"维护公告"},
    priority=5,
    block=True
)


@news_announce.handle()
async def handle_news_announce():
    """查询维护公告"""
    try:
        result = await api_client.get_news_announce(limit=3)
        data = result["data"]
        
        if not data:
            await news_announce.finish("暂无维护公告")
        
        msg = "📢 维护公告\n"
        for item in data:
            msg += f"\n📌 {item['title']}\n"
            msg += f"   📅 {item['date']}\n"
            msg += f"   🔗 {item['url']}\n"
        
        await news_announce.finish(msg)
        
    except JX3APIError as e:
        await news_announce.finish(f"查询失败：{e.msg}")


# ============== 新闻 ==============

news = on_command(
    "新闻",
    aliases={"公告", "官方新闻"},
    priority=5,
    block=True
)


@news.handle()
async def handle_news():
    """查询官方新闻"""
    try:
        result = await api_client.get_news_allnews(limit=5)
        data = result["data"]
        
        if not data:
            await news.finish("暂无新闻")
        
        msg = "📰 官方新闻\n"
        for item in data:
            msg += f"\n📌 {item['title']}\n"
            msg += f"   📅 {item['date']}\n"
        
        await news.finish(msg)
        
    except JX3APIError as e:
        await news.finish(f"查询失败：{e.msg}")


# ============== 技改 ==============

skill_records = on_command(
    "技改",
    aliases={"技能改动"},
    priority=5,
    block=True
)


@skill_records.handle()
async def handle_skill_records():
    """查询技改记录"""
    try:
        result = await api_client.get_skills_records()
        data = result["data"]
        
        if not data:
            await skill_records.finish("暂无技改记录")
        
        msg = "🔧 技能改动记录\n"
        for item in data[:5]:  # 只显示最近5条
            msg += f"\n📌 {item['title']}\n"
            msg += f"   📅 {item['time']}\n"
            msg += f"   🔗 {item['url']}\n"
        
        await skill_records.finish(msg)
        
    except JX3APIError as e:
        await skill_records.finish(f"查询失败：{e.msg}")


# ============== 百战 ==============

active_monster = on_command(
    "百战",
    aliases={"百战异闻录"},
    priority=5,
    block=True
)


@active_monster.handle()
async def handle_active_monster():
    """查询百战异闻录"""
    try:
        result = await api_client.get_active_monster()
        data = result["data"]
        
        msg = "👹 本周百战异闻录\n"
        
        for boss in data.get("data", []):
            msg += f"\n🔸 Lv.{boss['level']} {boss['name']}\n"
            if boss.get("skill"):
                msg += f"   技能：{', '.join(boss['skill'])}\n"
        
        await active_monster.finish(msg)
        
    except JX3APIError as e:
        await active_monster.finish(f"查询失败：{e.msg}")


# ============== 楚天社 ==============

chutian = on_command(
    "楚天社",
    priority=5,
    block=True
)


@chutian.handle()
async def handle_chutian():
    """查询楚天社进度"""
    try:
        result = await api_client.get_active_celebs("楚天社")
        data = result["data"]
        
        if not data:
            await chutian.finish("暂无楚天社数据")
        
        msg = "🏛️ 楚天社进度\n"
        for item in data:
            msg += f"\n📍 {item['map']} - {item['site']}\n"
            msg += f"   阶段：{item['stage']}\n"
            msg += f"   {item['desc']}\n"
            if item.get('time'):
                msg += f"   ⏰ {item['time']}\n"
        
        await chutian.finish(msg)
        
    except JX3APIError as e:
        await chutian.finish(f"查询失败：{e.msg}")


# ============== 云从社 ==============

yuncong = on_command(
    "云从社",
    priority=5,
    block=True
)


@yuncong.handle()
async def handle_yuncong():
    """查询云从社进度"""
    try:
        result = await api_client.get_active_celebs("云从社")
        data = result["data"]
        
        if not data:
            await yuncong.finish("暂无云从社数据")
        
        msg = "🏛️ 云从社进度\n"
        for item in data:
            msg += f"\n📍 {item['map']} - {item['site']}\n"
            msg += f"   阶段：{item['stage']}\n"
            msg += f"   {item['desc']}\n"
            if item.get('time'):
                msg += f"   ⏰ {item['time']}\n"
        
        await yuncong.finish(msg)
        
    except JX3APIError as e:
        await yuncong.finish(f"查询失败：{e.msg}")


# ============== 披风会 ==============

pifeng = on_command(
    "披风会",
    priority=5,
    block=True
)


@pifeng.handle()
async def handle_pifeng():
    """查询披风会进度"""
    try:
        result = await api_client.get_active_celebs("披风会")
        data = result["data"]
        
        if not data:
            await pifeng.finish("暂无披风会数据")
        
        msg = "🏛️ 披风会进度\n"
        for item in data:
            msg += f"\n📍 {item['map']} - {item['site']}\n"
            msg += f"   阶段：{item['stage']}\n"
            msg += f"   {item['desc']}\n"
            if item.get('time'):
                msg += f"   ⏰ {item['time']}\n"
        
        await pifeng.finish(msg)
        
    except JX3APIError as e:
        await pifeng.finish(f"查询失败：{e.msg}")


# ============== 扶摇 ==============

fuyao = on_command(
    "扶摇",
    aliases={"扶摇九天"},
    priority=5,
    block=True
)


@fuyao.handle()
async def handle_fuyao(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询扶摇时间"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event) if server_arg else None
    
    try:
        result = await api_client.get_active_next_event(server)
        data = result["data"]
        
        msg = "🎋 扶摇九天\n"
        msg += f"下次时间：{data.get('time', '未知')}\n"
        if server:
            msg += f"区服：{server}"
        
        await fuyao.finish(msg)
        
    except JX3APIError as e:
        await fuyao.finish(f"查询失败：{e.msg}")
