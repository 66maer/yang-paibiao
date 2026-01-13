"""
其他命令
副本、烟花统计、烟花记录、科举、骚话、舔狗日记
"""
import base64
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
from ..render.service import render_service


# ============== 副本 ==============

team_cd_list = on_command(
    "副本",
    aliases={"副本进度", "CD"},
    priority=5,
    block=True
)


@team_cd_list.handle()
async def handle_team_cd_list(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询副本进度"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await team_cd_list.finish("请提供角色名，例如：副本 梦江南 角色名")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_role_team_cd_list(server, name)
        data = result["data"]
        
        msg = f"📋 {name} 副本进度\n"
        msg += f"🖥️ {server}\n"
        
        if not data:
            msg += "暂无副本进度数据"
        elif isinstance(data, dict) and data.get("data"):
            for dungeon in data["data"][:10]:
                msg += f"\n• {dungeon.get('name', '未知')}"
                if dungeon.get('finished'):
                    msg += " ✅"
                else:
                    msg += f" ({dungeon.get('progress', 0)}/{dungeon.get('total', 0)})"
        
        await team_cd_list.finish(msg)
        
    except JX3APIError as e:
        await team_cd_list.finish(f"查询失败：{e.msg}")


# ============== 烟花统计 ==============

fireworks_collect = on_command(
    "烟花统计",
    priority=5,
    block=True
)


@fireworks_collect.handle()
async def handle_fireworks_collect(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询烟花统计 - 使用图片渲染"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event)
    
    try:
        result = await api_client.get_fireworks_collect(server)
        data = result["data"]
        
        if not data:
            await fireworks_collect.finish(f"🎆 {server} 暂无烟花记录")
        
        # 使用渲染服务
        try:
            render_data = {
                "server": server,
                "data": data[:15]  # 最多显示15条
            }
            img_bytes = await render_service.render(
                "fireworks_records",
                render_data,
                cache_key=f"fireworks_collect_{server}",
                use_cache=False
            )
            img_b64 = base64.b64encode(img_bytes).decode()
            await fireworks_collect.finish(MessageSegment.image(f"base64://{img_b64}"))
        except Exception:
            # 降级到文本
            msg = f"🎆 {server} 烟花统计（近7天）\n"
            receive_count = {}
            for record in data:
                receive = record.get("receive", "未知")
                receive_count[receive] = receive_count.get(receive, 0) + record.get("count", 1)
            
            sorted_receive = sorted(receive_count.items(), key=lambda x: x[1], reverse=True)
            
            msg += "\n【烟花接收榜】\n"
            for i, (name, count) in enumerate(sorted_receive[:10], 1):
                msg += f"{i}. {name}: {count}个\n"
            await fireworks_collect.finish(msg)
        
    except JX3APIError as e:
        await fireworks_collect.finish(f"查询失败：{e.msg}")


# ============== 烟花记录 ==============

fireworks_records = on_command(
    "烟花记录",
    priority=5,
    block=True
)


@fireworks_records.handle()
async def handle_fireworks_records(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询烟花记录"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await fireworks_records.finish("请提供角色名，例如：烟花记录 梦江南 角色名")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_fireworks_records(server, name)
        data = result["data"]
        
        msg = f"🎆 {name} 烟花记录\n"
        msg += f"🖥️ {server}\n"
        
        if not data:
            msg += "暂无烟花记录"
        else:
            for record in data[:10]:
                time_str = datetime.fromtimestamp(record.get("time", 0)).strftime("%m-%d %H:%M")
                sender = record.get("sender", "未知")
                firework = record.get("name", "烟花")
                msg += f"\n🎇 {sender} -> {firework} ({time_str})"
        
        await fireworks_records.finish(msg)
        
    except JX3APIError as e:
        await fireworks_records.finish(f"查询失败：{e.msg}")


# ============== 科举 ==============

exam_answer = on_command(
    "科举",
    aliases={"科举答案"},
    priority=5,
    block=True
)


@exam_answer.handle()
async def handle_exam_answer(args: Message = CommandArg()):
    """查询科举答案"""
    subject = args.extract_plain_text().strip()
    
    if not subject:
        await exam_answer.finish("请输入题目关键字，例如：科举 李白")
    
    try:
        result = await api_client.get_exam_answer(subject, limit=5)
        data = result["data"]
        
        if not data:
            await exam_answer.finish(f"未找到相关题目：{subject}")
        
        msg = f"📝 科举答案查询\n"
        
        for item in data:
            msg += f"\nQ：{item.get('question', '未知')}\n"
            msg += f"A：{item.get('answer', '未知')}\n"
        
        await exam_answer.finish(msg)
        
    except JX3APIError as e:
        await exam_answer.finish(f"查询失败：{e.msg}")


# ============== 骚话 ==============

saohua_random = on_command(
    "骚话",
    aliases={"随机骚话"},
    priority=5,
    block=True
)


@saohua_random.handle()
async def handle_saohua_random():
    """获取随机骚话"""
    try:
        result = await api_client.get_saohua_random()
        data = result["data"]
        
        text = data.get("text", "今天没有骚话")
        await saohua_random.finish(f"💬 {text}")
        
    except JX3APIError as e:
        await saohua_random.finish(f"获取失败：{e.msg}")


# ============== 舔狗日记 ==============

saohua_content = on_command(
    "舔狗日记",
    aliases={"舔狗"},
    priority=5,
    block=True
)


@saohua_content.handle()
async def handle_saohua_content():
    """获取舔狗日记"""
    try:
        result = await api_client.get_saohua_content()
        data = result["data"]
        
        text = data.get("text", "今天没有舔狗日记")
        await saohua_content.finish(f"📔 {text}")
        
    except JX3APIError as e:
        await saohua_content.finish(f"获取失败：{e.msg}")


# ============== 月历 (需要图片渲染，暂用文字) ==============

active_list_calendar = on_command(
    "月历",
    aliases={"活动月历"},
    priority=5,
    block=True
)


@active_list_calendar.handle()
async def handle_active_list_calendar():
    """查询活动月历"""
    try:
        result = await api_client.get_active_list_calendar(num=7)
        data = result["data"]
        
        msg = "📅 近期活动月历\n"
        
        if not data or not data.get("data"):
            msg += "暂无数据"
        else:
            today = data.get("today", {})
            msg += f"今日：{today.get('date', '')} 星期{today.get('week', '')}\n"
            
            for day in data["data"][:7]:
                msg += f"\n📆 {day.get('date', '')} 周{day.get('week', '')}\n"
                msg += f"   大战：{day.get('war', '无')}\n"
                msg += f"   战场：{day.get('battle', '无')}\n"
        
        await active_list_calendar.finish(msg)
        
    except JX3APIError as e:
        await active_list_calendar.finish(f"查询失败：{e.msg}")
