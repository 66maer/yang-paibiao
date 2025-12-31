from nonebot import get_plugin_config
from nonebot.plugin import PluginMetadata
from nonebot.log import logger

from .config import Config
from .api.client import init_api_client

__plugin_meta__ = PluginMetadata(
    name="xiaoyang",
    description="小杨排表机器人 - 剑网3团队管理助手",
    usage=(
        "查看团队/查团/有团吗 - 查看开放的团队列表\n"
        "查看团队 [序号] - 查看团队详情\n"
        "修改昵称 <新昵称> - 修改群昵称"
    ),
    config=Config,
)

# 获取配置
config = get_plugin_config(Config)

# 初始化 API 客户端
try:
    init_api_client(config)
    logger.success("小杨机器人 API 客户端初始化成功")
except Exception as e:
    logger.error(f"小杨机器人 API 客户端初始化失败: {e}")

# 导入 matchers（自动注册）
from .adapters import matchers as _

