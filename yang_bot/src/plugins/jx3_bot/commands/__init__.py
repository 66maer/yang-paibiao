"""
命令模块
按功能分类组织所有 JX3 Bot 命令
"""

# 导入所有命令模块，让 NoneBot 能够加载它们
from . import admin  # 管理命令：绑定区服、查看绑定等
from . import daily  # 日常活动：日常、开服、维护、新闻等
from . import role   # 角色战绩：角色详情、属性、奇穴、阵眼、名剑排行等
from . import luck   # 奇遇宠物：奇遇记录、奇遇统计、蹲宠、赤兔等
from . import trade  # 交易物品：金价、物价、拍卖、挂件、装饰等
from . import faction  # 阵营帮会：沙盘、关隘、诛恶、招募等
from . import rank   # 排行榜：名士、江湖、兵甲等排行
from . import misc   # 其他：副本、烟花、科举、骚话等

__all__ = [
    "admin",
    "daily",
    "role",
    "luck",
    "trade",
    "faction",
    "rank",
    "misc",
]
