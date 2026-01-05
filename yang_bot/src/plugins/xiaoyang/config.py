from typing import Optional, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Config(BaseSettings):
    """小秧机器人配置"""

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

    # 前端配置
    frontend_url: str = Field(
        default="http://localhost:5173",
        description="前端页面地址"
    )

    # 群组配置
    guild_id: Optional[int] = Field(
        default=None,
        description="QQ群号(对应后端的guild_id)"
    )

    @field_validator('guild_id', mode='before')
    @classmethod
    def validate_guild_id(cls, v):
        """验证 guild_id，空字符串转为 None"""
        if v == "" or v is None:
            return None
        return int(v)

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

    # ==================== NLP 解析器配置 ====================
    # 解析器类型选择
    parser_type: Literal["keyword", "nlp"] = Field(
        default="keyword",
        description="消息解析器类型: keyword(关键词) 或 nlp(大模型)"
    )

    # NLP 服务配置
    nlp_api_base: str = Field(
        default="https://dashscope.aliyuncs.com/compatible-mode/v1",
        description="NLP API 基础地址（OpenAI 兼容接口）"
    )
    nlp_api_key: str = Field(
        default="",
        description="NLP API Key"
    )
    nlp_model: str = Field(
        default="qwen-plus",
        description="NLP 模型名称"
    )
    nlp_timeout: int = Field(
        default=15,
        description="NLP 请求超时时间(秒)"
    )
    nlp_max_tokens: int = Field(
        default=256,
        description="NLP 响应最大 token 数"
    )
    nlp_temperature: float = Field(
        default=0.1,
        description="NLP 温度参数（越低越确定性）"
    )

    # NLP 会话配置
    nlp_max_history: int = Field(
        default=5,
        description="NLP 会话最大历史轮数"
    )
    nlp_session_timeout: int = Field(
        default=180,
        description="NLP 会话超时时间(秒)，默认3分钟"
    )
