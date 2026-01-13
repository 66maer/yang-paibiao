"""
管理命令
群配置管理：绑定区服、查看绑定等
"""
from nonebot import on_command
from nonebot.permission import SUPERUSER
from nonebot.adapters.onebot.v11 import (
    Bot,
    GroupMessageEvent,
    Message,
    MessageSegment,
)
from nonebot.adapters.onebot.v11.permission import GROUP_ADMIN, GROUP_OWNER
from nonebot.params import CommandArg

from ..data.guild_config import guild_config
from ..utils.server_list import match_server, get_server_list


# ============== 绑定区服 ==============

bind_server = on_command(
    "绑定区服",
    aliases={"绑定服务器", "设置区服"},
    permission=GROUP_ADMIN | GROUP_OWNER | SUPERUSER,
    priority=5,
    block=True
)


@bind_server.handle()
async def handle_bind_server(
    bot: Bot,
    event: GroupMessageEvent,
    args: Message = CommandArg()
):
    """绑定群区服"""
    server_name = args.extract_plain_text().strip()
    
    if not server_name:
        await bind_server.finish("请指定区服名称，例如：绑定区服 梦江南")
    
    # 匹配区服
    matched_server = match_server(server_name)
    if not matched_server:
        servers = "、".join(get_server_list()[:10])
        await bind_server.finish(
            f"未找到区服「{server_name}」\n"
            f"可用区服示例：{servers}..."
        )
    
    # 保存绑定
    guild_id = str(event.group_id)
    guild_config.set_server(guild_id, matched_server)
    
    await bind_server.finish(f"✅ 已将本群绑定到区服「{matched_server}」")


# ============== 查看绑定 ==============

view_binding = on_command(
    "查看绑定",
    aliases={"当前区服", "绑定信息"},
    priority=5,
    block=True
)


@view_binding.handle()
async def handle_view_binding(event: GroupMessageEvent):
    """查看当前群绑定"""
    guild_id = str(event.group_id)
    settings = guild_config.get(guild_id)
    
    if settings.server:
        await view_binding.finish(f"📍 当前群绑定区服：{settings.server}")
    else:
        await view_binding.finish(
            "📍 本群尚未绑定区服\n"
            "管理员可使用「绑定区服 <服务器名>」进行绑定"
        )


# ============== 解除绑定 ==============

unbind_server = on_command(
    "解除绑定",
    aliases={"取消绑定", "解绑区服"},
    permission=GROUP_ADMIN | GROUP_OWNER | SUPERUSER,
    priority=5,
    block=True
)


@unbind_server.handle()
async def handle_unbind_server(event: GroupMessageEvent):
    """解除群区服绑定"""
    guild_id = str(event.group_id)
    settings = guild_config.get(guild_id)
    
    if not settings.server:
        await unbind_server.finish("本群尚未绑定区服")
    
    old_server = settings.server
    settings.server = ""
    guild_config._save()
    
    await unbind_server.finish(f"✅ 已解除区服「{old_server}」的绑定")


# ============== 区服列表 ==============

server_list_cmd = on_command(
    "区服列表",
    aliases={"服务器列表"},
    priority=5,
    block=True
)


@server_list_cmd.handle()
async def handle_server_list():
    """显示可用区服列表"""
    servers = get_server_list()
    
    # 分组显示
    msg = "📋 可用区服列表：\n"
    for i, server in enumerate(servers):
        msg += f"{server}"
        if (i + 1) % 5 == 0:
            msg += "\n"
        else:
            msg += "、"
    
    msg = msg.rstrip("、\n")
    await server_list_cmd.finish(msg)


# ============== JX3 帮助 ==============

jx3_help = on_command(
    "jx3帮助",
    aliases={"jx3help", "剑三帮助", "剑网三帮助"},
    priority=5,
    block=True
)


@jx3_help.handle()
async def handle_jx3_help():
    """显示帮助信息"""
    help_text = """📖 JX3 Bot 指令帮助

【管理命令】
• 绑定区服 <服务器名> - 绑定群默认区服（管理员）
• 查看绑定 - 查看当前群绑定信息
• 解除绑定 - 解除区服绑定（管理员）
• 区服列表 - 显示可用区服

【日常活动】
• 日常 [区服] - 查询今日活动
• 月历 - 查询活动月历
• 开服 [区服] - 查询开服状态
• 维护 - 查询维护公告
• 新闻 - 查询官方新闻
• 百战 - 查询百战异闻录
• 楚天社/云从社/披风会 - 查询声望进度

【角色查询】
• 角色详情 <区服> <角色名>
• 属性 <区服> <角色名>
• 精耐 <区服> <角色名>
• 名片 <区服> <角色名>
• 奇穴 <心法> / 阵眼 <心法>

【奇遇相关】
• 奇遇记录 <区服> <角色名>
• 奇遇统计 <区服> <奇遇名>
• 奇遇汇总 <区服>
• 未出奇遇 <区服> <角色名>
• 蹲宠 <区服> / 赤兔 / 马场

【交易物品】
• 金价 [区服] - 查询金价
• 物价 <物品名> - 查询物价
• 拍卖记录 <区服> <物品名>
• 的卢 <区服> / 全服掉落 <物品名>

【阵营帮会】
• 沙盘 [区服] / 关隘 / 诛恶 [区服]
• 招募/师父/徒弟 <区服> <关键词>

【排行榜】
• 名士/江湖/兵甲/名师/阵营/薪火/家园排行 [区服]

【其他】
• 科举 <题目> / 骚话 / 舔狗日记

💡 提示：省略区服参数时将使用群绑定的区服"""
    
    await jx3_help.finish(help_text)
