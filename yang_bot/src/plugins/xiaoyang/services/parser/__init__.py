"""消息解析器模块"""
from typing import Optional
from nonebot.log import logger

from .base import MessageParser, ParsedIntent
from .keyword_parser import KeywordParser

# 全局解析器实例（单例）
_parser_instance: Optional[MessageParser] = None


def get_parser() -> MessageParser:
    """
    获取解析器实例（单例模式）

    根据配置决定使用哪种解析器：
    - keyword: 关键词解析器（默认）
    - nlp: 基于大模型的 NLP 解析器

    Returns:
        MessageParser: 解析器实例
    """
    global _parser_instance

    if _parser_instance is not None:
        return _parser_instance

    # 延迟导入配置，避免循环依赖
    from nonebot import get_plugin_config
    from ...config import Config

    config = get_plugin_config(Config)

    if config.parser_type == "nlp":
        # 检查 NLP 配置是否完整
        if not config.nlp_api_key:
            logger.warning("NLP API Key 未配置，回退到关键词解析器")
            _parser_instance = KeywordParser()
        else:
            from .nlp_parser import NLPParser
            _parser_instance = NLPParser(
                api_base=config.nlp_api_base,
                api_key=config.nlp_api_key,
                model=config.nlp_model,
                timeout=config.nlp_timeout,
                max_tokens=config.nlp_max_tokens,
                temperature=config.nlp_temperature,
                max_history=config.nlp_max_history,
            )
            logger.info(f"使用 NLP 解析器: {config.nlp_model}")
    else:
        _parser_instance = KeywordParser()
        logger.info("使用关键词解析器")

    return _parser_instance


__all__ = [
    "MessageParser",
    "ParsedIntent",
    "KeywordParser",
    "get_parser",
]
