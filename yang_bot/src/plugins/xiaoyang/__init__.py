from nonebot import get_plugin_config
from nonebot.plugin import PluginMetadata
from nonebot.log import logger

from .config import Config
from .api.client import init_api_client

__plugin_meta__ = PluginMetadata(
    name="xiaoyang",
    description="小秧排表机器人",
    usage=(
        "查看团队/查团/有团吗 - 查看开放的团队列表\n"
        "查看团队 [序号] - 查看团队详情\n"
        "修改昵称 <新昵称> - 修改群昵称"
    ),
    config=Config,
)

# 使用官方推荐的方式获取插件配置
config = get_plugin_config(Config)

# 打印配置信息用于调试
logger.debug(f"加载到的 xiaoyang 配置: {config.model_dump()}")
logger.info(f"配置加载完成:")
logger.info(f"  - Backend API URL: {config.backend_api_url}")
logger.info(f"  - Guild ID: {config.guild_id}")
logger.info(f"  - API Key 已配置: {'是' if config.backend_api_key else '否'}")
if config.backend_api_key:
    # 只显示前20个字符，避免泄露完整 API Key
    api_key_preview = config.backend_api_key[:20] + "..." if len(config.backend_api_key) > 20 else config.backend_api_key
    logger.info(f"  - API Key 预览: {api_key_preview}")
else:
    logger.warning(f"  ⚠️  API Key 未配置或为空！")

# 初始化 API 客户端
try:
    init_api_client(config)
    logger.success("小秧机器人 API 客户端初始化成功")
except Exception as e:
    logger.error(f"小秧机器人 API 客户端初始化失败: {e}")

# 导入 matchers 和 event_handlers（自动注册）
from .adapters import matchers as _
from .adapters import event_handlers as _

# 注册 HTTP API 路由
try:
    from nonebot import get_app
    from .http_api import api_router, root_router

    app = get_app()
    app.include_router(api_router)
    app.include_router(root_router)
    logger.success("小秧机器人 HTTP API 路由注册成功")
except Exception as e:
    logger.error(f"小秧机器人 HTTP API 路由注册失败: {e}")

