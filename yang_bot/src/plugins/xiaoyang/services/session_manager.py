"""会话管理器 - 用于处理需要多轮交互的场景"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from nonebot.log import logger


@dataclass
class SessionData:
    """会话数据"""
    user_id: str
    group_id: str
    action: str  # 当前等待的操作，如 "cancel_signup_select"
    data: Dict[str, Any]  # 会话数据
    created_at: datetime
    expires_at: datetime


class SessionManager:
    """会话管理器 - 用于处理需要多轮交互的场景"""

    def __init__(self, timeout: int = 60):
        """
        初始化会话管理器

        Args:
            timeout: 会话超时时间（秒），默认 60 秒
        """
        self._sessions: Dict[str, SessionData] = {}
        self._timeout = timeout

    def create_session(
        self,
        user_id: str,
        group_id: str,
        action: str,
        data: Dict[str, Any]
    ) -> str:
        """
        创建会话

        Args:
            user_id: 用户 ID
            group_id: 群组 ID
            action: 当前操作
            data: 会话数据

        Returns:
            str: 会话 key
        """
        session_key = f"{group_id}_{user_id}"
        now = datetime.now()

        session = SessionData(
            user_id=user_id,
            group_id=group_id,
            action=action,
            data=data,
            created_at=now,
            expires_at=now + timedelta(seconds=self._timeout)
        )

        self._sessions[session_key] = session
        logger.info(f"创建会话: {session_key}, action={action}")
        return session_key

    def get_session(self, user_id: str, group_id: str) -> Optional[SessionData]:
        """
        获取会话

        Args:
            user_id: 用户 ID
            group_id: 群组 ID

        Returns:
            Optional[SessionData]: 会话数据，如果不存在或已过期返回 None
        """
        session_key = f"{group_id}_{user_id}"
        session = self._sessions.get(session_key)

        if not session:
            return None

        # 检查是否过期
        if datetime.now() > session.expires_at:
            logger.info(f"会话已过期: {session_key}")
            del self._sessions[session_key]
            return None

        return session

    def close_session(self, user_id: str, group_id: str):
        """
        关闭会话

        Args:
            user_id: 用户 ID
            group_id: 群组 ID
        """
        session_key = f"{group_id}_{user_id}"
        if session_key in self._sessions:
            logger.info(f"关闭会话: {session_key}")
            del self._sessions[session_key]

    def cleanup_expired(self):
        """清理过期会话"""
        now = datetime.now()
        expired_keys = [
            key for key, session in self._sessions.items()
            if now > session.expires_at
        ]
        for key in expired_keys:
            logger.info(f"清理过期会话: {key}")
            del self._sessions[key]


# 全局会话管理器单例
_session_manager: Optional[SessionManager] = None


def get_session_manager() -> SessionManager:
    """获取全局会话管理器实例"""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager
