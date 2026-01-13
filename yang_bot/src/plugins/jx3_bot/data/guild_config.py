"""
群配置管理
使用 JSON 文件存储群绑定的区服和功能开关
"""
import json
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass, field, asdict
from nonebot import logger

from ..config import Config

config = Config()


@dataclass
class GuildSettings:
    """群配置"""
    server: str = ""  # 绑定的区服
    enabled: bool = True  # 是否启用机器人功能


class GuildConfigManager:
    """群配置管理器"""

    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = Path(data_dir or config.data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.config_file = self.data_dir / "guilds.json"
        self._cache: Dict[str, GuildSettings] = {}
        self._load()

    def _load(self):
        """从文件加载配置"""
        if self.config_file.exists():
            try:
                with open(self.config_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for guild_id, settings in data.items():
                    self._cache[guild_id] = GuildSettings(**settings)
                logger.info(f"已加载 {len(self._cache)} 个群配置")
            except Exception as e:
                logger.error(f"加载群配置失败: {e}")
                self._cache = {}
        else:
            self._cache = {}

    def _save(self):
        """保存配置到文件"""
        try:
            data = {
                guild_id: asdict(settings)
                for guild_id, settings in self._cache.items()
            }
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"保存群配置失败: {e}")

    def get(self, guild_id: str) -> GuildSettings:
        """获取群配置"""
        if guild_id not in self._cache:
            self._cache[guild_id] = GuildSettings()
        return self._cache[guild_id]

    def get_server(self, guild_id: str) -> Optional[str]:
        """获取群绑定的区服"""
        settings = self.get(guild_id)
        return settings.server if settings.server else None

    def set_server(self, guild_id: str, server: str) -> bool:
        """设置群绑定的区服"""
        settings = self.get(guild_id)
        settings.server = server
        self._save()
        logger.info(f"群 {guild_id} 已绑定区服: {server}")
        return True

    def is_enabled(self, guild_id: str) -> bool:
        """检查群是否启用机器人功能"""
        return self.get(guild_id).enabled

    def set_enabled(self, guild_id: str, enabled: bool):
        """设置群是否启用机器人功能"""
        settings = self.get(guild_id)
        settings.enabled = enabled
        self._save()

    def list_all(self) -> Dict[str, GuildSettings]:
        """列出所有群配置"""
        return self._cache.copy()


# 全局实例
guild_config = GuildConfigManager()
