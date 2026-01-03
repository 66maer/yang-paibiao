from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Config(BaseSettings):
    """小杨机器人配置"""

    model_config = SettingsConfigDict(
        env_prefix="xiaoyang__",  # 对应环境变量前缀 XIAOYANG__
        env_file=(".env", ".env.prod"),
        extra="ignore",
    )

    # 后端API配置
    backend_api_url: str = Field(
        default="http://localhost:8000",
        description="后端API地址"
    )
    backend_api_key: str = Field(
        default="",
        description="Bot API Key"
    )

    # 群组配置
    guild_id: int = Field(
        default=0,
        description="QQ群号(对应后端的guild_id)"
    )

    # 功能开关
    enable_auto_sync_members: bool = Field(
        default=True,
        description="是否自动同步群成员"
    )

    # 超时配置
    api_timeout: int = Field(
        default=30,
        description="API请求超时时间(秒)"
    )

    # 会话配置
    session_timeout: int = Field(
        default=60,
        description="会话超时时间(秒)"
    )
