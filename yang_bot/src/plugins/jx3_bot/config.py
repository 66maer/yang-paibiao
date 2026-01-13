"""
JX3 Bot 配置
"""
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Config(BaseSettings):
    """JX3 Bot 配置"""

    model_config = SettingsConfigDict(
        env_prefix="jx3bot__",  # 对应环境变量前缀 JX3BOT__
        env_file=(".env", ".env.prod"),
        extra="ignore",
    )

    # JX3API 配置
    jx3api_token: str = Field(
        default="",
        description="JX3API Token (从 https://www.jx3api.com 获取)"
    )
    jx3api_ticket: str = Field(
        default="",
        description="推栏 Ticket (用于部分需要推栏认证的接口)"
    )
    jx3api_base_url: str = Field(
        default="https://www.jx3api.com",
        description="JX3API 基础地址"
    )

    # 超时配置
    api_timeout: int = Field(
        default=30,
        description="API 请求超时时间(秒)"
    )

    # 默认区服（当群未绑定时使用）
    default_server: str = Field(
        default="梦江南",
        description="默认区服"
    )

    # 功能开关
    enable_image_render: bool = Field(
        default=True,
        description="是否启用图片渲染"
    )

    # 数据目录
    data_dir: str = Field(
        default="data/jx3bot",
        description="数据存储目录"
    )
