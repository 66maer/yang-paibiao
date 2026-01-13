"""
排行榜命令
名士、江湖、兵甲、名师、阵营、薪火、家园排行
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


# 排行榜配置
RANK_CONFIG = {
    "名士": {"table": "个人", "name": "名士五十强"},
    "江湖": {"table": "个人", "name": "老江湖五十强"},
    "兵甲": {"table": "个人", "name": "兵甲藏家五十强"},
    "名师": {"table": "个人", "name": "名师五十强"},
    "阵营": {"table": "个人", "name": "阵营英雄五十强"},
    "薪火": {"table": "个人", "name": "薪火相传五十强"},
    "家园": {"table": "个人", "name": "庐园广记一百强"},
}


async def handle_rank(
    rank_type: str,
    event: GroupMessageEvent,
    args: Message
):
    """通用排行榜处理"""
    server_arg = args.extract_plain_text().strip()
    server = get_effective_server(server_arg, event)
    
    config = RANK_CONFIG.get(rank_type)
    if not config:
        return f"未知的排行榜类型：{rank_type}"
    
    try:
        result = await api_client.get_rank_statistical(
            server=server,
            table=config["table"],
            name=config["name"]
        )
        data = result["data"]
        
        msg = f"🏆 {server} {config['name']}\n"
        
        if not data:
            msg += "暂无排行数据"
        else:
            for i, player in enumerate(data[:20], 1):
                msg += f"\n{i}. {player.get('roleName', '未知')}"
                if player.get('forceName'):
                    msg += f" ({player['forceName']})"
                if player.get('value'):
                    msg += f" - {player['value']}"
        
        return msg
        
    except JX3APIError as e:
        return f"查询失败：{e.msg}"


# ============== 名士排行 ==============

rank_mingshi = on_command(
    "名士排行",
    aliases={"名士五十强"},
    priority=5,
    block=True
)


@rank_mingshi.handle()
async def handle_rank_mingshi(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    msg = await handle_rank("名士", event, args)
    await rank_mingshi.finish(msg)


# ============== 江湖排行 ==============

rank_jianghu = on_command(
    "江湖排行",
    aliases={"老江湖排行", "资历排行"},
    priority=5,
    block=True
)


@rank_jianghu.handle()
async def handle_rank_jianghu(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    msg = await handle_rank("江湖", event, args)
    await rank_jianghu.finish(msg)


# ============== 兵甲排行 ==============

rank_bingjia = on_command(
    "兵甲排行",
    aliases={"兵甲藏家排行"},
    priority=5,
    block=True
)


@rank_bingjia.handle()
async def handle_rank_bingjia(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    msg = await handle_rank("兵甲", event, args)
    await rank_bingjia.finish(msg)


# ============== 名师排行 ==============

rank_mingshi2 = on_command(
    "名师排行",
    aliases={"名师五十强排行"},
    priority=5,
    block=True
)


@rank_mingshi2.handle()
async def handle_rank_mingshi2(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    msg = await handle_rank("名师", event, args)
    await rank_mingshi2.finish(msg)


# ============== 阵营排行 ==============

rank_zhenying = on_command(
    "阵营排行",
    aliases={"阵营英雄排行"},
    priority=5,
    block=True
)


@rank_zhenying.handle()
async def handle_rank_zhenying(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    msg = await handle_rank("阵营", event, args)
    await rank_zhenying.finish(msg)


# ============== 薪火排行 ==============

rank_xinhuo = on_command(
    "薪火排行",
    aliases={"薪火相传排行"},
    priority=5,
    block=True
)


@rank_xinhuo.handle()
async def handle_rank_xinhuo(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    msg = await handle_rank("薪火", event, args)
    await rank_xinhuo.finish(msg)


# ============== 家园排行 ==============

rank_jiayuan = on_command(
    "家园排行",
    aliases={"庐园广记排行"},
    priority=5,
    block=True
)


@rank_jiayuan.handle()
async def handle_rank_jiayuan(
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    msg = await handle_rank("家园", event, args)
    await rank_jiayuan.finish(msg)
