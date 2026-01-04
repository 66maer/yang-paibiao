"""数据模块"""
from .xinfa import (
    XINFA_INFO,
    is_xinfa_name,
    normalize_xinfa_name,
    xinfa_matches,
    get_xinfa_info,
)

__all__ = [
    "XINFA_INFO",
    "is_xinfa_name",
    "normalize_xinfa_name",
    "xinfa_matches",
    "get_xinfa_info",
]
