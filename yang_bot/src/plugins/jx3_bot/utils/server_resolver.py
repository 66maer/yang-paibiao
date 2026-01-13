"""
区服解析工具
从命令参数或群配置中获取区服
"""
from typing import Optional, Tuple
from nonebot.adapters.onebot.v11 import GroupMessageEvent

from .server_list import match_server
from ..data.guild_config import guild_config
from ..config import Config

config = Config()


def resolve_server(
    args: list,
    event: Optional[GroupMessageEvent] = None
) -> Tuple[Optional[str], list]:
    """
    解析区服参数
    
    优先级：
    1. 命令参数中的区服
    2. 群绑定的区服
    3. 默认区服
    
    Args:
        args: 命令参数列表
        event: 群消息事件
        
    Returns:
        (区服名称, 剩余参数列表)
    """
    remaining_args = []
    server = None
    
    # 从参数中查找区服
    for arg in args:
        matched = match_server(arg)
        if matched and server is None:
            server = matched
        else:
            remaining_args.append(arg)
    
    # 如果参数中没有区服，尝试从群配置获取
    if server is None and event is not None:
        guild_id = str(event.group_id)
        server = guild_config.get_server(guild_id)
    
    # 如果群也没有绑定，使用默认区服
    if server is None:
        server = config.default_server
    
    return server, remaining_args


def get_guild_server(event: GroupMessageEvent) -> Optional[str]:
    """获取群绑定的区服"""
    guild_id = str(event.group_id)
    return guild_config.get_server(guild_id)


def get_effective_server(
    server_arg: Optional[str],
    event: Optional[GroupMessageEvent] = None
) -> str:
    """
    获取有效的区服名称
    
    Args:
        server_arg: 用户提供的区服参数
        event: 群消息事件
        
    Returns:
        有效的区服名称
    """
    # 如果提供了参数，尝试匹配
    if server_arg:
        matched = match_server(server_arg)
        if matched:
            return matched
    
    # 从群配置获取
    if event is not None:
        guild_id = str(event.group_id)
        guild_server = guild_config.get_server(guild_id)
        if guild_server:
            return guild_server
    
    # 返回默认区服
    return config.default_server
