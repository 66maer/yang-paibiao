"""
交易与物品命令
金价、物价、贴吧物价、拍卖记录、的卢、掉落、挂件、装饰、器物谱
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


# ============== 金价 ==============

trade_demon = on_command(
    "金价",
    aliases={"金价比例"},
    priority=5,
    block=True
)


@trade_demon.handle()
async def handle_trade_demon(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询金价"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event) if server_arg else None
    
    try:
        result = await api_client.get_trade_demon(server=server)
        data = result["data"]
        
        if not data:
            await trade_demon.finish("暂无金价数据")
        
        # 取第一条数据
        price = data[0] if isinstance(data, list) else data
        
        msg = f"💰 金价查询\n"
        if price.get("server"):
            msg += f"🖥️ {price.get('zone', '')} - {price['server']}\n"
        msg += f"\n贴吧：{price.get('tieba', '未知')} 元/万金\n"
        msg += f"万宝楼：{price.get('wanbaolou', '未知')} 元/万金\n"
        msg += f"DD373：{price.get('dd373', '未知')} 元/万金\n"
        msg += f"UU898：{price.get('uu898', '未知')} 元/万金\n"
        msg += f"5173：{price.get('5173', '未知')} 元/万金\n"
        msg += f"7881：{price.get('7881', '未知')} 元/万金"
        
        await trade_demon.finish(msg)
        
    except JX3APIError as e:
        await trade_demon.finish(f"查询失败：{e.msg}")


# ============== 物价 ==============

trade_records = on_command(
    "物价",
    aliases={"黑市物价"},
    priority=5,
    block=True
)


@trade_records.handle()
async def handle_trade_records(args: Message = CommandArg()):
    """查询物价 - 使用图片渲染"""
    name = args.extract_plain_text().strip()
    
    if not name:
        await trade_records.finish("请提供物品名称，例如：物价 千机匣")
    
    try:
        result = await api_client.get_trade_item_records(name)
        data = result["data"]
        
        if not data:
            await trade_records.finish(f"未找到 {name} 的物价记录")
        
        # 准备渲染数据
        render_data = {
            "name": data.get("name", name),
            "view": data.get("view", ""),
            "item_class": data.get("class", "物品"),
            "alias": data.get("alias", ""),
            "subalias": data.get("subalias", ""),
            "desc": data.get("desc", ""),
            "list": data.get("list", [[], [], [], [], [], []]),
            "data": data,  # 完整数据用于JS图表
        }
        
        # 使用渲染服务生成图片
        try:
            img_bytes = await render_service.render(
                "trade_records",
                render_data,
                cache_key=f"trade_{name}",
                use_cache=False
            )
            img_b64 = base64.b64encode(img_bytes).decode()
            await trade_records.finish(MessageSegment.image(f"base64://{img_b64}"))
        except Exception as render_error:
            # 渲染失败时回退到文字
            msg = f"💎 {name} 物价信息\n"
            if data.get("list") and data["list"][4]:
                msg += "\n【在售期】\n"
                for record in data["list"][4][:5]:
                    msg += f"• {record.get('server', '未知')}: ¥{record.get('value', 0)}\n"
            await trade_records.finish(msg)
        
    except JX3APIError as e:
        await trade_records.finish(f"查询失败：{e.msg}")


# ============== 贴吧物价 ==============

tieba_item = on_command(
    "贴吧物价",
    priority=5,
    block=True
)


@tieba_item.handle()
async def handle_tieba_item(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询贴吧物价"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await tieba_item.finish("请提供物品名称，例如：贴吧物价 梦江南 千机匣")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = None
        name = arg_list[0]
    
    try:
        result = await api_client.get_tieba_item_records(name, server)
        data = result["data"]
        
        msg = f"📰 贴吧物价 - {name}\n"
        if server:
            msg += f"🖥️ {server}\n"
        
        if not data:
            msg += "暂无贴吧物价记录"
        else:
            for record in data[:8]:
                msg += f"\n• {record.get('price', '未知')}金"
                msg += f" - {record.get('title', '')[:20]}"
        
        await tieba_item.finish(msg)
        
    except JX3APIError as e:
        await tieba_item.finish(f"查询失败：{e.msg}")


# ============== 拍卖记录 ==============

auction_records = on_command(
    "拍卖记录",
    aliases={"拍卖纪录"},
    priority=5,
    block=True
)


@auction_records.handle()
async def handle_auction_records(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询拍卖记录 - 使用图片渲染"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await auction_records.finish("请提供物品名称，例如：拍卖记录 梦江南 千机匣")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_auction_records(server, name)
        data = result["data"]
        
        if not data:
            await auction_records.finish(f"🔨 {name} 暂无拍卖记录")
        
        # 使用渲染服务
        try:
            render_data = {"data": data[:20]}
            img_bytes = await render_service.render(
                "auction_record",
                render_data,
                cache_key=f"auction_{server}_{name}",
                use_cache=False
            )
            img_b64 = base64.b64encode(img_bytes).decode()
            await auction_records.finish(MessageSegment.image(f"base64://{img_b64}"))
        except Exception:
            # 降级到文本
            msg = f"🔨 拍卖记录 - {name}\n"
            msg += f"🖥️ {server}\n"
            for record in data[:10]:
                time_str = datetime.fromtimestamp(record.get("time", 0)).strftime("%m-%d")
                msg += f"\n• {record.get('price', 0)}金 - {time_str}"
                if record.get("buyer"):
                    msg += f" ({record['buyer']})"
            await auction_records.finish(msg)
        
    except JX3APIError as e:
        await auction_records.finish(f"查询失败：{e.msg}")


# ============== 的卢 ==============

dilu_records = on_command(
    "的卢",
    aliases={"的卢记录"},
    priority=5,
    block=True
)


@dilu_records.handle()
async def handle_dilu_records(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询的卢记录"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event) if server_arg else None
    
    try:
        result = await api_client.get_dilu_records(server)
        data = result["data"]
        
        msg = "🐴 的卢刷新记录\n"
        if server:
            msg += f"🖥️ {server}\n"
        
        if not data:
            msg += "暂无的卢记录"
        else:
            for record in data[:10]:
                time_str = datetime.fromtimestamp(record.get("time", 0)).strftime("%m-%d %H:%M")
                msg += f"\n• {record.get('server', '未知')}"
                msg += f" @ {record.get('map', '未知')}"
                msg += f" - {time_str}"
        
        await dilu_records.finish(msg)
        
    except JX3APIError as e:
        await dilu_records.finish(f"查询失败：{e.msg}")


# ============== 全服掉落 ==============

reward_server = on_command(
    "全服掉落",
    priority=5,
    block=True
)


@reward_server.handle()
async def handle_reward_server(args: Message = CommandArg()):
    """查询全服掉落统计"""
    name = args.extract_plain_text().strip()
    
    if not name:
        await reward_server.finish("请提供物品名称，例如：全服掉落 千机匣")
    
    try:
        result = await api_client.get_reward_server_statistical(name)
        data = result["data"]
        
        msg = f"🎁 全服掉落统计 - {name}\n"
        
        if not data:
            msg += "暂无掉落记录"
        else:
            for record in data[:15]:
                msg += f"\n• {record.get('server', '未知')}: {record.get('count', 0)}次"
        
        await reward_server.finish(msg)
        
    except JX3APIError as e:
        await reward_server.finish(f"查询失败：{e.msg}")


# ============== 掉落 ==============

reward_statistical = on_command(
    "掉落",
    aliases={"副本掉落"},
    priority=5,
    block=True
)


@reward_statistical.handle()
async def handle_reward_statistical(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """查询副本掉落统计"""
    arg_list = parse_args(args.extract_plain_text())
    
    if len(arg_list) < 1:
        await reward_statistical.finish("请提供物品名称，例如：掉落 梦江南 千机匣")
    
    if len(arg_list) >= 2:
        server = get_effective_server(arg_list[0], event)
        name = arg_list[1]
    else:
        server = get_effective_server(None, event)
        name = arg_list[0]
    
    try:
        result = await api_client.get_reward_statistical(server, name)
        data = result["data"]
        
        msg = f"🎁 掉落统计 - {name}\n"
        msg += f"🖥️ {server}\n"
        
        if not data:
            msg += "暂无掉落记录"
        else:
            for record in data[:10]:
                time_str = datetime.fromtimestamp(record.get("time", 0)).strftime("%m-%d")
                msg += f"\n• {record.get('name', '未知')} - {time_str}"
        
        await reward_statistical.finish(msg)
        
    except JX3APIError as e:
        await reward_statistical.finish(f"查询失败：{e.msg}")


# ============== 挂件 ==============

archived_pendant = on_command(
    "挂件",
    priority=5,
    block=True
)


@archived_pendant.handle()
async def handle_archived_pendant(args: Message = CommandArg()):
    """查询挂件信息"""
    name = args.extract_plain_text().strip()
    
    if not name:
        await archived_pendant.finish("请提供挂件名称，例如：挂件 月下桃花")
    
    try:
        result = await api_client.get_archived_pendant(name)
        data = result["data"]
        
        msg = f"🎀 挂件信息 - {name}\n"
        
        if not data:
            msg += "未找到该挂件"
        else:
            if data.get("name"):
                msg += f"📛 {data['name']}\n"
            if data.get("type"):
                msg += f"📂 类型：{data['type']}\n"
            if data.get("source"):
                msg += f"📍 获取方式：{data['source']}\n"
            if data.get("desc"):
                msg += f"📝 描述：{data['desc']}\n"
        
        await archived_pendant.finish(msg)
        
    except JX3APIError as e:
        await archived_pendant.finish(f"查询失败：{e.msg}")


# ============== 装饰 ==============

home_furniture = on_command(
    "装饰",
    aliases={"家园装饰"},
    priority=5,
    block=True
)


@home_furniture.handle()
async def handle_home_furniture(args: Message = CommandArg()):
    """查询家园装饰"""
    name = args.extract_plain_text().strip()
    
    if not name:
        await home_furniture.finish("请提供装饰名称，例如：装饰 屏风")
    
    try:
        result = await api_client.get_home_furniture(name)
        data = result["data"]
        
        if not data:
            await home_furniture.finish(f"未找到装饰：{name}")
        
        msg = f"🏠 家园装饰\n"
        
        for item in data[:3]:
            msg += f"\n📦 {item.get('name', name)}\n"
            msg += f"   来源：{item.get('source', '未知')}\n"
            msg += f"   品质：{item.get('quality', '未知')}\n"
            msg += f"   价格：{item.get('architecture', 0)}\n"
            msg += f"   等级要求：{item.get('limit', 0)}\n"
            msg += f"   风水：{item.get('geomantic', 0)} | 观赏：{item.get('view', 0)}\n"
            msg += f"   实用：{item.get('practical', 0)} | 坚固：{item.get('hard', 0)}\n"
        
        await home_furniture.finish(msg)
        
    except JX3APIError as e:
        await home_furniture.finish(f"查询失败：{e.msg}")


# ============== 器物谱 ==============

home_travel = on_command(
    "器物谱",
    priority=5,
    block=True
)


@home_travel.handle()
async def handle_home_travel(args: Message = CommandArg()):
    """查询地图产出家具"""
    name = args.extract_plain_text().strip()
    
    if not name:
        await home_travel.finish("请提供地图名称，例如：器物谱 长安城")
    
    try:
        result = await api_client.get_home_travel(name)
        data = result["data"]
        
        if not data:
            await home_travel.finish(f"未找到地图：{name}")
        
        msg = f"🗺️ {name} 器物谱\n"
        msg += f"共 {len(data)} 种家具\n"
        
        for item in data[:8]:
            msg += f"\n• {item.get('name', '未知')}"
            msg += f" ({item.get('quality', '?')}品质)"
        
        await home_travel.finish(msg)
        
    except JX3APIError as e:
        await home_travel.finish(f"查询失败：{e.msg}")
