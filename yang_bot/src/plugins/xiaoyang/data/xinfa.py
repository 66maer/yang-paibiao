"""
心法数据模块
从前端 frontend/src/config/xinfa.js 转换而来
"""
from typing import Dict, List, Optional

# 心法信息表
XINFA_INFO: Dict[str, Dict[str, any]] = {
    "huajian": {
        "name": "花间游",
        "nickname": ["花间", "花间游", "草里爬"],
        "menpai": "万花",
        "type": ["dps", "内功", "元气"],
    },
    "lijing": {
        "name": "离经易道",
        "nickname": ["奶花", "离经易道", "离经", "花奶"],
        "menpai": "万花",
        "type": ["奶妈"],
    },
    "binxin": {
        "name": "冰心诀",
        "nickname": ["冰心", "冰心诀", "冰心决"],
        "menpai": "七秀",
        "type": ["dps", "内功", "根骨"],
    },
    "yunchang": {
        "name": "云裳心经",
        "nickname": ["奶秀", "云裳心经", "云裳", "秀奶"],
        "menpai": "七秀",
        "type": ["奶妈"],
    },
    "yijin": {
        "name": "易筋经",
        "nickname": ["和尚", "易筋经", "易筋", "秃子", "光头", "灯泡", "秃驴"],
        "menpai": "少林",
        "type": ["dps", "内功", "元气"],
    },
    "xisui": {
        "name": "洗髓经",
        "nickname": ["和尚T", "洗髓经", "洗髓", "秃T", "圣僧", "佛祖"],
        "menpai": "少林",
        "type": ["T"],
    },
    "zixia": {
        "name": "紫霞功",
        "nickname": ["气纯", "紫霞功", "紫霞"],
        "menpai": "纯阳",
        "type": ["dps", "内功", "根骨"],
    },
    "taixu": {
        "name": "太虚剑意",
        "nickname": ["剑纯", "太虚剑意", "备胎"],
        "menpai": "纯阳",
        "type": ["dps", "外功", "身法"],
    },
    "aoxue": {
        "name": "傲血战意",
        "nickname": ["天策", "傲血战意", "傲血", "哈士奇", "狗子", "二哈"],
        "menpai": "天策",
        "type": ["dps", "外功", "力道"],
    },
    "tielao": {
        "name": "铁牢律",
        "nickname": ["策T", "铁牢律", "铁牢", "天策T"],
        "menpai": "天策",
        "type": ["T"],
    },
    "wenshui": {
        "name": "问水诀",
        "nickname": ["藏剑", "问水诀", "问水", "问水决", "黄鸡", "叽", "黄叽", "KFC", "kfc", "星期四"],
        "menpai": "藏剑",
        "type": ["dps", "外功", "身法"],
    },
    "dujing": {
        "name": "毒经",
        "nickname": ["毒经", "五毒"],
        "menpai": "五毒",
        "type": ["dps", "内功", "根骨"],
    },
    "butian": {
        "name": "补天诀",
        "nickname": ["奶毒", "补天诀", "补天", "毒奶"],
        "menpai": "五毒",
        "type": ["奶妈"],
    },
    "jingyu": {
        "name": "惊羽诀",
        "nickname": ["鲸鱼", "惊羽诀", "惊羽", "惊羽决"],
        "menpai": "唐门",
        "type": ["dps", "外功", "力道"],
    },
    "tianluo": {
        "name": "天罗诡道",
        "nickname": ["田螺", "天罗诡道", "天罗"],
        "menpai": "唐门",
        "type": ["dps", "内功", "元气"],
    },
    "fenying": {
        "name": "焚影圣诀",
        "nickname": ["焚影", "焚影圣诀", "喵", "喵喵", "明教"],
        "menpai": "明教",
        "type": ["dps", "内功", "元气"],
    },
    "mingzun": {
        "name": "明尊琉璃体",
        "nickname": ["喵T", "明尊琉璃体", "明尊", "明教T"],
        "menpai": "明教",
        "type": ["T"],
    },
    "xiaochen": {
        "name": "笑尘诀",
        "nickname": ["丐帮", "笑尘诀", "帅比", "无敌心法", "最强心法"],
        "menpai": "丐帮",
        "type": ["dps", "外功", "力道"],
    },
    "fenshan": {
        "name": "分山劲",
        "nickname": ["苍云", "分山劲", "分山", "岔劲", "乌龟", "龟龟", "盾盾"],
        "menpai": "苍云",
        "type": ["dps", "外功", "身法"],
    },
    "tiegu": {
        "name": "铁骨衣",
        "nickname": ["苍云T", "铁骨衣", "铁骨"],
        "menpai": "苍云",
        "type": ["T"],
    },
    "mowen": {
        "name": "莫问",
        "nickname": ["莫问", "长歌", "鸽子", "咕咕"],
        "menpai": "长歌",
        "type": ["dps", "内功", "根骨"],
    },
    "xiangzhi": {
        "name": "相知",
        "nickname": ["奶歌", "相知", "歌奶", "奶鸽", "鸽奶", "奶咕", "咕奶"],
        "menpai": "长歌",
        "type": ["奶妈"],
    },
    "beiao": {
        "name": "北傲诀",
        "nickname": ["霸刀", "北傲诀", "貂貂"],
        "menpai": "霸刀",
        "type": ["dps", "外功", "力道"],
    },
    "linghai": {
        "name": "凌海诀",
        "nickname": ["蓬莱", "凌海诀", "凌海决", "伞"],
        "menpai": "蓬莱",
        "type": ["dps", "外功", "身法"],
    },
    "yinlong": {
        "name": "隐龙诀",
        "nickname": ["凌雪", "隐龙诀", "隐龙决", "凌雪阁"],
        "menpai": "凌雪",
        "type": ["dps", "外功", "身法"],
    },
    "taixuan": {
        "name": "太玄经",
        "nickname": ["衍天", "太玄经", "衍天宗", "灯灯", "算卦的"],
        "menpai": "衍天",
        "type": ["dps", "内功", "元气"],
    },
    "wufang": {
        "name": "无方",
        "nickname": ["无方", "药宗", "药药"],
        "menpai": "药宗",
        "type": ["dps", "内功", "根骨"],
    },
    "lingsu": {
        "name": "灵素",
        "nickname": ["奶药", "药奶", "灵素"],
        "menpai": "药宗",
        "type": ["奶妈"],
    },
    "gufeng": {
        "name": "孤峰诀",
        "nickname": ["刀宗", "孤峰诀", "孤峰决"],
        "menpai": "刀宗",
        "type": ["dps", "外功", "力道"],
    },
    "shanhai": {
        "name": "山海心诀",
        "nickname": ["万灵", "山海心诀", "弓"],
        "menpai": "万灵",
        "type": ["dps", "外功", "身法"],
    },
    "zhoutian": {
        "name": "周天功",
        "nickname": ["段氏", "周天功", "扇子", "扇"],
        "menpai": "段氏",
        "type": ["dps", "内功", "元气"],
    },
    "youluo": {
        "name": "幽罗引",
        "nickname": ["幽罗", "幽罗引", "无相楼", "无相", "五香楼", "五香", "无相引", "傀儡", "傀儡师", "唱戏的"],
        "menpai": "无相楼",
        "type": ["dps", "内功", "根骨"],
    },
}

# 构建快速查找表
_NICKNAME_TO_XINFA: Dict[str, str] = {}
_ALL_XINFA_NAMES: List[str] = []

for key, info in XINFA_INFO.items():
    standard_name = info["name"]
    _ALL_XINFA_NAMES.append(standard_name)

    # 标准名称映射到自己
    _NICKNAME_TO_XINFA[standard_name.lower()] = standard_name

    # 所有昵称映射到标准名称
    for nickname in info["nickname"]:
        _NICKNAME_TO_XINFA[nickname.lower()] = standard_name


def is_xinfa_name(text: str) -> bool:
    """
    判断文本是否是心法名（包括标准名称和昵称）

    Args:
        text: 待判断的文本

    Returns:
        bool: 是否是心法名

    Example:
        >>> is_xinfa_name("藏剑")
        True
        >>> is_xinfa_name("黄鸡")
        True
        >>> is_xinfa_name("某个角色名")
        False
    """
    return text.lower() in _NICKNAME_TO_XINFA


def normalize_xinfa_name(text: str) -> str:
    """
    将心法昵称转换为标准名称

    Args:
        text: 心法名称或昵称

    Returns:
        str: 标准心法名称，如果不是心法名则返回原文本

    Example:
        >>> normalize_xinfa_name("藏剑")
        '问水诀'
        >>> normalize_xinfa_name("KFC")
        '问水诀'
        >>> normalize_xinfa_name("问水诀")
        '问水诀'
    """
    return _NICKNAME_TO_XINFA.get(text.lower(), text)


def get_xinfa_info(text: str) -> Optional[Dict[str, any]]:
    """
    获取心法的完整信息

    Args:
        text: 心法名称或昵称

    Returns:
        Optional[Dict]: 心法信息字典，如果不是心法名则返回 None

    Example:
        >>> info = get_xinfa_info("藏剑")
        >>> info["name"]
        '问水诀'
        >>> info["menpai"]
        '藏剑'
    """
    standard_name = normalize_xinfa_name(text)

    # 查找对应的心法key
    for key, info in XINFA_INFO.items():
        if info["name"] == standard_name:
            return info

    return None


def get_all_xinfa_names() -> List[str]:
    """
    获取所有心法的标准名称列表

    Returns:
        List[str]: 心法标准名称列表
    """
    return _ALL_XINFA_NAMES.copy()


def get_dps_xinfa_names() -> List[str]:
    """
    获取所有DPS心法的标准名称列表

    Returns:
        List[str]: DPS心法标准名称列表
    """
    return [info["name"] for info in XINFA_INFO.values() if "dps" in info["type"]]


def get_healer_xinfa_names() -> List[str]:
    """
    获取所有奶妈心法的标准名称列表

    Returns:
        List[str]: 奶妈心法标准名称列表
    """
    return [info["name"] for info in XINFA_INFO.values() if "奶妈" in info["type"]]


def get_tank_xinfa_names() -> List[str]:
    """
    获取所有T心法的标准名称列表

    Returns:
        List[str]: T心法标准名称列表
    """
    return [info["name"] for info in XINFA_INFO.values() if "T" in info["type"]]


def xinfa_matches(xinfa1: str, xinfa2: str) -> bool:
    """
    判断两个心法名是否指向同一个心法
    支持英文key、中文标准名、昵称的任意组合匹配

    Args:
        xinfa1: 心法名称1（可以是英文key、中文名或昵称）
        xinfa2: 心法名称2（可以是英文key、中文名或昵称）

    Returns:
        bool: 是否是同一个心法

    Example:
        >>> xinfa_matches("xiaochen", "笑尘诀")
        True
        >>> xinfa_matches("丐帮", "笑尘诀")
        True
        >>> xinfa_matches("xiaochen", "花间游")
        False
    """
    # 尝试从英文key获取标准名称
    def get_standard_name(text: str) -> Optional[str]:
        # 首先检查是否是英文key
        if text in XINFA_INFO:
            return XINFA_INFO[text]["name"]
        # 否则尝试通过昵称映射获取
        return _NICKNAME_TO_XINFA.get(text.lower())

    name1 = get_standard_name(xinfa1)
    name2 = get_standard_name(xinfa2)

    # 如果任一个无法识别，返回False
    if name1 is None or name2 is None:
        return False

    return name1 == name2
