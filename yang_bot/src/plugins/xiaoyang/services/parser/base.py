"""消息解析器基类 - 策略模式"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class ParsedIntent:
    """解析后的意图"""
    action: str  # 动作类型: "signup", "proxy_signup", "register_rich", "cancel_signup" 等
    params: Dict[str, Any]  # 解析出的参数
    confidence: float = 1.0  # 置信度 0-1，默认为1.0
    need_followup: bool = False  # 是否需要追问用户
    followup_question: Optional[str] = None  # 追问问题


class MessageParser(ABC):
    """消息解析器基类 - 策略模式"""

    @abstractmethod
    async def parse(self, message: str, context: Dict[str, Any]) -> Optional[ParsedIntent]:
        """
        解析消息

        Args:
            message: 用户消息
            context: 上下文信息(用户ID、群ID等)

        Returns:
            ParsedIntent or None: 解析结果，如果无法解析则返回 None
        """
        pass
