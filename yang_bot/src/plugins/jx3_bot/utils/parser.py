"""
参数解析工具
"""
from typing import List, Optional, Dict, Any, Callable


class ArgParser:
    """无序参数解析器"""
    
    def __init__(self, args: List[str]):
        """
        初始化解析器
        
        Args:
            args: 参数列表
        """
        self.tokens = set(arg for arg in args if arg)
        self.parsed: Dict[str, str] = {}
    
    def try_match(self, key: str, enum_values: List[str]) -> Optional[str]:
        """
        尝试从枚举值中匹配
        
        Args:
            key: 参数名
            enum_values: 可选值列表
            
        Returns:
            匹配到的值，未匹配返回 None
        """
        matched = [t for t in self.tokens if t in enum_values]
        if len(matched) == 1:
            value = matched[0]
            self.tokens.discard(value)
            self.parsed[key] = value
            return value
        return None
    
    def try_match_by(
        self,
        key: str,
        validator: Callable[[str], bool]
    ) -> Optional[str]:
        """
        使用验证器匹配参数
        
        Args:
            key: 参数名
            validator: 验证函数
            
        Returns:
            匹配到的值，未匹配返回 None
        """
        matched = [t for t in self.tokens if validator(t)]
        if len(matched) == 1:
            value = matched[0]
            self.tokens.discard(value)
            self.parsed[key] = value
            return value
        return None
    
    def get_remaining(self) -> List[str]:
        """获取剩余未匹配的参数"""
        return list(self.tokens)
    
    def get_first_remaining(self) -> Optional[str]:
        """获取第一个剩余参数"""
        remaining = self.get_remaining()
        return remaining[0] if remaining else None
    
    def get_parsed(self) -> Dict[str, str]:
        """获取已解析的参数"""
        return self.parsed.copy()


def parse_args(text: str) -> List[str]:
    """
    解析命令参数
    
    Args:
        text: 命令文本（不含命令名）
        
    Returns:
        参数列表
    """
    return [arg.strip() for arg in text.split() if arg.strip()]
