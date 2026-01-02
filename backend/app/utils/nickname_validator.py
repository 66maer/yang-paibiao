"""
昵称验证工具
"""
import re
from typing import Optional


def validate_nickname(nickname: str) -> tuple[bool, Optional[str]]:
    """
    验证昵称是否符合规则
    
    规则：
    1. 最多6个字符（汉字、英文都算一个字符）
    2. 只允许中文汉字、英文字母（大小写）、数字
    3. 不允许特殊符号、表情等
    
    Args:
        nickname: 要验证的昵称
        
    Returns:
        tuple[bool, Optional[str]]: (是否有效, 错误信息)
    """
    if not nickname:
        return False, "昵称不能为空"
    
    # 去除首尾空格
    nickname = nickname.strip()
    
    if not nickname:
        return False, "昵称不能为空"
    
    # 计算字符长度（汉字、英文、数字都算一个字符）
    char_count = len(nickname)
    
    if char_count > 6:
        return False, "昵称最多6个字符"
    
    # 只允许中文汉字、英文字母、数字
    # \u4e00-\u9fff 是中文汉字的 Unicode 范围
    # a-zA-Z 是英文字母
    # 0-9 是数字
    pattern = r'^[\u4e00-\u9fffa-zA-Z0-9]+$'
    
    if not re.match(pattern, nickname):
        return False, "昵称只能包含中文、英文字母和数字，不允许特殊符号和表情"
    
    return True, None


def validate_nickname_raise(nickname: str) -> str:
    """
    验证昵称，如果不符合规则则抛出异常
    
    Args:
        nickname: 要验证的昵称
        
    Returns:
        str: 处理后的昵称（去除首尾空格）
        
    Raises:
        ValueError: 昵称不符合规则
    """
    is_valid, error_msg = validate_nickname(nickname)
    if not is_valid:
        raise ValueError(error_msg)
    return nickname.strip()
