"""
服务器列表与匹配工具
"""
from typing import Optional, List, Tuple

# 服务器列表 - 包含正式名称和常用别名
SERVER_ALIASES = {
    # 电信一区
    "缘起稻香": ["缘起稻香", "缘起", "稻香"],
    "天宝盛世": ["天宝盛世", "天宝"],
    "幽月轮": ["幽月轮", "幽月"],
    "绝代天骄": ["绝代天骄", "天骄", "绝代"],
    
    # 电信五区
    "梦江南": ["梦江南", "双梦", "梦江"],
    
    # 电信八区
    "唯我独尊": ["唯我独尊", "唯满侠", "唯我"],
    
    # 双线一区
    "龙争虎斗": ["龙争虎斗", "龙虎"],
    
    # 双线二区
    "长安城": ["长安城", "长安"],
    
    # 双线四区
    "乾坤一掷": ["乾坤一掷", "华乾", "乾坤"],
    
    # 大区服
    "斗转星移": ["斗转星移", "姨妈", "斗转"],
    "剑胆琴心": ["剑胆琴心", "剑胆", "琴心"],
    "蝶恋花": ["蝶恋花", "蝶服"],
    "山海相逢": ["山海相逢", "山海"],
    "眉间雪": ["眉间雪"],
    "破阵子": ["破阵子", "念破", "破阵"],
    "天鹅坪": ["天鹅坪", "天鹅"],
    "飞龙在天": ["飞龙在天", "飞龙"],
    "青梅煮酒": ["青梅煮酒", "青梅"],
    
    # 更多服务器...
    "横刀断浪": ["横刀断浪", "横刀"],
    "雪花飘落": ["雪花飘落", "雪花"],
    "江南草木": ["江南草木", "江南"],
    "奶牛爱吃草": ["奶牛爱吃草", "奶牛"],
    
    # PVP服务器
    "烟雨江南": ["烟雨江南", "烟雨"],
    "风雪断桥": ["风雪断桥", "风雪"],
    "霜月龙吟": ["霜月龙吟", "霜月"],
}

# 生成所有服务器的正式名称列表
SERVER_LIST = list(SERVER_ALIASES.keys())

# 生成别名到正式名称的映射
_ALIAS_TO_SERVER = {}
for server, aliases in SERVER_ALIASES.items():
    for alias in aliases:
        _ALIAS_TO_SERVER[alias.lower()] = server


def get_server_list() -> List[str]:
    """获取所有服务器列表"""
    return SERVER_LIST.copy()


def match_server(name: str) -> Optional[str]:
    """
    匹配服务器名称
    
    Args:
        name: 服务器名称或别名
        
    Returns:
        匹配到的正式服务器名称，未匹配到返回 None
    """
    if not name:
        return None
    
    name_lower = name.lower().strip()
    
    # 精确匹配别名
    if name_lower in _ALIAS_TO_SERVER:
        return _ALIAS_TO_SERVER[name_lower]
    
    # 模糊匹配 - 包含关系
    for alias, server in _ALIAS_TO_SERVER.items():
        if name_lower in alias or alias in name_lower:
            return server
    
    return None


def fuzzy_match_server(name: str, threshold: float = 0.6) -> Optional[Tuple[str, float]]:
    """
    模糊匹配服务器名称
    
    Args:
        name: 服务器名称
        threshold: 匹配阈值 (0-1)
        
    Returns:
        (服务器名称, 匹配度) 或 None
    """
    if not name:
        return None
    
    # 先尝试精确匹配
    exact = match_server(name)
    if exact:
        return (exact, 1.0)
    
    # 简单的字符重叠匹配
    name_set = set(name)
    best_match = None
    best_score = 0.0
    
    for server in SERVER_LIST:
        server_set = set(server)
        intersection = len(name_set & server_set)
        union = len(name_set | server_set)
        score = intersection / union if union > 0 else 0
        
        if score > best_score and score >= threshold:
            best_score = score
            best_match = server
    
    if best_match:
        return (best_match, best_score)
    
    return None


def is_valid_server(name: str) -> bool:
    """检查是否是有效的服务器名称"""
    return match_server(name) is not None
