"""API 客户端"""
import httpx
from typing import Optional, Dict, Any
from ..config import Config


class APIError(Exception):
    """API 错误"""
    pass


class APIClient:
    """后端 API 客户端"""

    def __init__(self, config: Config, guild_id: Optional[int] = None):
        self.base_url = config.backend_api_url
        self.api_key = config.backend_api_key
        self.guild_id = guild_id or config.guild_id
        self.timeout = config.api_timeout

        # 延迟导入避免循环依赖
        from .endpoints.teams import TeamsEndpoint
        from .endpoints.signups import SignupsEndpoint
        from .endpoints.characters import CharactersEndpoint
        from .endpoints.members import MembersEndpoint

        # 初始化各个端点
        self.teams = TeamsEndpoint(self)
        self.signups = SignupsEndpoint(self)
        self.characters = CharactersEndpoint(self)
        self.members = MembersEndpoint(self)

    async def request(
        self,
        method: str,
        path: str,
        **kwargs
    ) -> Any:
        """
        发起 HTTP 请求

        Args:
            method: HTTP 方法 (GET, POST, PUT, DELETE 等)
            path: API 路径
            **kwargs: 其他参数 (json, params, headers 等)

        Returns:
            响应数据 (data 字段内容)

        Raises:
            APIError: API 错误
        """
        url = f"{self.base_url}{path}"
        headers = kwargs.pop("headers", {})

        # 添加调试日志
        from nonebot.log import logger
        if not self.api_key:
            logger.warning(f"⚠️  API Key 为空！无法发送请求到 {method} {path}")
        else:
            api_key_preview = self.api_key[:20] + "..." if len(self.api_key) > 20 else self.api_key
            logger.debug(f"发送请求: {method} {path}, API Key: {api_key_preview}")

        headers["X-API-Key"] = self.api_key

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    **kwargs
                )
                response.raise_for_status()

                data = response.json()

                # 后端统一返回格式: {code, message, data}
                if data.get("code") != 200:
                    raise APIError(data.get("message", "API 错误"))

                return data.get("data")

            except httpx.HTTPStatusError as e:
                # HTTP 状态码错误
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get("detail", str(e))
                except Exception:
                    error_msg = str(e)
                raise APIError(f"HTTP 错误: {error_msg}")

            except httpx.HTTPError as e:
                # 其他 HTTP 错误 (连接超时、网络问题等)
                raise APIError(f"请求失败: {str(e)}")

            except Exception as e:
                # 其他异常
                raise APIError(f"未知错误: {str(e)}")


# 全局配置
_config: Optional[Config] = None


def init_api_client(config: Config):
    """
    初始化 API 客户端配置

    Args:
        config: 配置对象
    """
    global _config
    _config = config


def get_api_client(guild_id: Optional[int] = None) -> APIClient:
    """
    获取 API 客户端实例

    Args:
        guild_id: 群组 ID（从事件中获取）

    Returns:
        APIClient: API 客户端实例

    Raises:
        RuntimeError: 如果配置未初始化
    """
    if _config is None:
        raise RuntimeError("API 客户端未初始化，请先调用 init_api_client()")

    # 每次创建新的客户端实例，使用传入的 guild_id
    return APIClient(_config, guild_id=guild_id)
