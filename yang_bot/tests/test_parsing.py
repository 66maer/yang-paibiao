"""单元测试：解析函数和辅助函数

测试纯函数逻辑，不依赖 NoneBot 运行时环境。
"""
import sys
import os
import importlib

# 将心法数据模块所在目录直接添加到 path，绕过插件 __init__.py 的 NoneBot 初始化
_xinfa_path = os.path.join(
    os.path.dirname(__file__), "..", "src", "plugins", "xiaoyang", "data"
)
sys.path.insert(0, _xinfa_path)

import pytest

# 直接导入 xinfa 模块，不经过插件包的 __init__.py
import xinfa as _xinfa_mod

is_xinfa_name = _xinfa_mod.is_xinfa_name
get_xinfa_key = _xinfa_mod.get_xinfa_key
normalize_xinfa_name = _xinfa_mod.normalize_xinfa_name
xinfa_matches = _xinfa_mod.xinfa_matches
XINFA_INFO = _xinfa_mod.XINFA_INFO


# ==================== parse_signup_args ====================
# 因为 matchers.py 导入了 nonebot，我们在此手动复现 parse_signup_args 的逻辑来测试。
# 这样可以避免 nonebot 初始化依赖。

def parse_signup_args(text):
    """复制自 matchers.py 的 parse_signup_args，确保逻辑一致"""
    from typing import Optional, Tuple
    parts = text.strip().split()
    if not parts:
        return None, None, None

    team_index = None
    non_number_parts = []

    for part in parts:
        try:
            num = int(part)
            if team_index is None:
                team_index = num
            else:
                non_number_parts.append(part)
        except ValueError:
            non_number_parts.append(part)

    arg1 = non_number_parts[0] if len(non_number_parts) > 0 else None
    arg2 = non_number_parts[1] if len(non_number_parts) > 1 else None

    return team_index, arg1, arg2


def resolve_xinfa_and_character(arg1, arg2):
    """复制自 matchers.py 的 resolve_xinfa_and_character"""
    if arg1 is None and arg2 is None:
        return None, None

    if arg2 is None:
        if is_xinfa_name(arg1):
            return get_xinfa_key(arg1), None
        else:
            return None, arg1

    is_arg1_xinfa = is_xinfa_name(arg1)
    is_arg2_xinfa = is_xinfa_name(arg2)

    if is_arg1_xinfa and not is_arg2_xinfa:
        return get_xinfa_key(arg1), arg2
    elif not is_arg1_xinfa and is_arg2_xinfa:
        return get_xinfa_key(arg2), arg1
    elif is_arg1_xinfa and is_arg2_xinfa:
        return get_xinfa_key(arg1), arg2
    else:
        return None, None


def format_xinfa_display(xinfa):
    """复制自 matchers.py"""
    if not xinfa:
        return "未知"
    if xinfa in XINFA_INFO:
        return XINFA_INFO[xinfa]["name"]
    normalized = normalize_xinfa_name(xinfa)
    return normalized if normalized != xinfa or not xinfa else xinfa


# ==================== parse_signup_args 测试 ====================

class TestParseSignupArgs:
    """测试报名参数解析"""

    def test_empty_string(self):
        assert parse_signup_args("") == (None, None, None)

    def test_only_whitespace(self):
        assert parse_signup_args("   ") == (None, None, None)

    # --- 只有心法 ---
    def test_xinfa_only(self):
        assert parse_signup_args("丐帮") == (None, "丐帮", None)

    def test_xinfa_alias(self):
        assert parse_signup_args("花间") == (None, "花间", None)

    # --- 心法 + 角色名 ---
    def test_xinfa_and_character(self):
        assert parse_signup_args("丐帮 丐箩箩") == (None, "丐帮", "丐箩箩")

    def test_character_then_xinfa(self):
        """角色名在前心法在后"""
        assert parse_signup_args("丐箩箩 丐帮") == (None, "丐箩箩", "丐帮")

    # --- 编号在前面 ---
    def test_index_first_xinfa(self):
        assert parse_signup_args("1 丐帮") == (1, "丐帮", None)

    def test_index_first_xinfa_character(self):
        assert parse_signup_args("1 丐帮 丐箩箩") == (1, "丐帮", "丐箩箩")

    # --- 编号在中间 ---
    def test_index_middle(self):
        assert parse_signup_args("丐帮 1 丐箩箩") == (1, "丐帮", "丐箩箩")

    # --- 编号在末尾 ---
    def test_index_last_one_arg(self):
        assert parse_signup_args("丐帮 1") == (1, "丐帮", None)

    def test_index_last_two_args(self):
        assert parse_signup_args("丐帮 丐箩箩 1") == (1, "丐帮", "丐箩箩")

    # --- 只有编号 ---
    def test_index_only(self):
        assert parse_signup_args("1") == (1, None, None)

    def test_index_only_2(self):
        assert parse_signup_args("2") == (2, None, None)

    # --- 多个数字 ---
    def test_multiple_numbers(self):
        """多个数字，第一个当编号，后续当参数"""
        result = parse_signup_args("1 2 丐帮")
        assert result == (1, "2", "丐帮")

    # --- 角色名是数字的情况不太可能但测一下 ---
    def test_number_then_text(self):
        assert parse_signup_args("3 花间 小花") == (3, "花间", "小花")

    # --- 更多心法别名 ---
    def test_various_xinfa_aliases(self):
        # 藏剑昵称
        assert parse_signup_args("KFC") == (None, "KFC", None)
        # 气纯
        assert parse_signup_args("气纯") == (None, "气纯", None)
        # 奶花
        assert parse_signup_args("奶花") == (None, "奶花", None)

    def test_index_with_various_xinfas(self):
        assert parse_signup_args("2 气纯 小气") == (2, "气纯", "小气")
        assert parse_signup_args("气纯 小气 2") == (2, "气纯", "小气")
        assert parse_signup_args("气纯 2 小气") == (2, "气纯", "小气")


# ==================== resolve_xinfa_and_character 测试 ====================

class TestResolveXinfaAndCharacter:
    """测试心法和角色名识别"""

    def test_both_none(self):
        assert resolve_xinfa_and_character(None, None) == (None, None)

    def test_single_xinfa_name(self):
        xinfa, char = resolve_xinfa_and_character("丐帮", None)
        assert xinfa == "xiaochen"
        assert char is None

    def test_single_xinfa_alias(self):
        xinfa, char = resolve_xinfa_and_character("花间", None)
        assert xinfa == "huajian"
        assert char is None

    def test_single_character_name(self):
        xinfa, char = resolve_xinfa_and_character("丐箩箩", None)
        assert xinfa is None
        assert char == "丐箩箩"

    def test_xinfa_first_character_second(self):
        xinfa, char = resolve_xinfa_and_character("丐帮", "丐箩箩")
        assert xinfa == "xiaochen"
        assert char == "丐箩箩"

    def test_character_first_xinfa_second(self):
        """自动识别：角色名在前，心法在后"""
        xinfa, char = resolve_xinfa_and_character("丐箩箩", "丐帮")
        assert xinfa == "xiaochen"
        assert char == "丐箩箩"

    def test_both_xinfa(self):
        """两个都是心法名，第一个当心法，第二个当角色名"""
        xinfa, char = resolve_xinfa_and_character("花间", "丐帮")
        assert xinfa == "huajian"
        assert char == "丐帮"

    def test_both_non_xinfa(self):
        """两个都不是心法"""
        xinfa, char = resolve_xinfa_and_character("小明", "大号")
        assert xinfa is None
        assert char is None

    def test_kfc_alias(self):
        """测试 KFC -> 问水诀"""
        xinfa, char = resolve_xinfa_and_character("KFC", "剑宝宝")
        assert xinfa == "wenshui"
        assert char == "剑宝宝"

    def test_reverse_kfc(self):
        xinfa, char = resolve_xinfa_and_character("剑宝宝", "KFC")
        assert xinfa == "wenshui"
        assert char == "剑宝宝"

    def test_tank_xinfa(self):
        xinfa, char = resolve_xinfa_and_character("和尚T", None)
        assert xinfa == "xisui"

    def test_healer_xinfa(self):
        xinfa, char = resolve_xinfa_and_character("奶秀", "七七")
        assert xinfa == "yunchang"
        assert char == "七七"


# ==================== format_xinfa_display 测试 ====================

class TestFormatXinfaDisplay:
    """测试心法显示格式化"""

    def test_none(self):
        assert format_xinfa_display(None) == "未知"

    def test_empty(self):
        assert format_xinfa_display("") == "未知"

    def test_english_key(self):
        assert format_xinfa_display("huajian") == "花间游"

    def test_english_key_gaibang(self):
        assert format_xinfa_display("xiaochen") == "笑尘诀"

    def test_unknown_key(self):
        result = format_xinfa_display("不存在的")
        assert result == "不存在的"


# ==================== xinfa 数据模块测试 ====================

class TestXinfaData:
    """测试心法数据模块的函数"""

    def test_is_xinfa_standard_name(self):
        assert is_xinfa_name("花间游") is True
        assert is_xinfa_name("紫霞功") is True

    def test_is_xinfa_nickname(self):
        assert is_xinfa_name("花间") is True
        assert is_xinfa_name("气纯") is True
        assert is_xinfa_name("奶花") is True
        assert is_xinfa_name("KFC") is True

    def test_is_xinfa_case_insensitive(self):
        assert is_xinfa_name("kfc") is True

    def test_is_xinfa_false(self):
        assert is_xinfa_name("丐箩箩") is False
        assert is_xinfa_name("随便一个名字") is False
        assert is_xinfa_name("") is False

    def test_get_xinfa_key(self):
        assert get_xinfa_key("花间游") == "huajian"
        assert get_xinfa_key("花间") == "huajian"
        assert get_xinfa_key("KFC") == "wenshui"
        assert get_xinfa_key("丐帮") == "xiaochen"

    def test_get_xinfa_key_english(self):
        assert get_xinfa_key("huajian") == "huajian"

    def test_get_xinfa_key_not_found(self):
        assert get_xinfa_key("不存在") is None

    def test_normalize_xinfa_name(self):
        assert normalize_xinfa_name("花间") == "花间游"
        assert normalize_xinfa_name("KFC") == "问水诀"
        assert normalize_xinfa_name("丐帮") == "笑尘诀"

    def test_normalize_unknown(self):
        assert normalize_xinfa_name("随便") == "随便"

    def test_xinfa_matches_same(self):
        assert xinfa_matches("花间", "花间游") is True
        assert xinfa_matches("huajian", "花间") is True
        assert xinfa_matches("KFC", "问水诀") is True

    def test_xinfa_matches_different(self):
        assert xinfa_matches("花间", "气纯") is False


# ==================== 集成性的端到端解析测试 ====================

class TestEndToEndParsing:
    """模拟完整的报名参数解析流程（parse_signup_args + resolve）"""

    def _parse_and_resolve(self, text):
        team_index, arg1, arg2 = parse_signup_args(text)
        xinfa, char = resolve_xinfa_and_character(arg1, arg2)
        return team_index, xinfa, char

    def test_full_format_standard(self):
        """报名 1 丐帮 丐箩箩"""
        idx, xinfa, char = self._parse_and_resolve("1 丐帮 丐箩箩")
        assert idx == 1
        assert xinfa == "xiaochen"
        assert char == "丐箩箩"

    def test_full_no_index(self):
        """报名 丐帮 丐箩箩"""
        idx, xinfa, char = self._parse_and_resolve("丐帮 丐箩箩")
        assert idx is None
        assert xinfa == "xiaochen"
        assert char == "丐箩箩"

    def test_full_index_at_end(self):
        """报名 丐帮 丐箩箩 1"""
        idx, xinfa, char = self._parse_and_resolve("丐帮 丐箩箩 1")
        assert idx == 1
        assert xinfa == "xiaochen"
        assert char == "丐箩箩"

    def test_full_index_in_middle(self):
        """报名 丐帮 1 丐箩箩"""
        idx, xinfa, char = self._parse_and_resolve("丐帮 1 丐箩箩")
        assert idx == 1
        assert xinfa == "xiaochen"
        assert char == "丐箩箩"

    def test_full_reversed_order(self):
        """报名 丐箩箩 丐帮 1 - 角色名在心法前"""
        idx, xinfa, char = self._parse_and_resolve("丐箩箩 丐帮 1")
        assert idx == 1
        assert xinfa == "xiaochen"
        assert char == "丐箩箩"

    def test_xinfa_only_no_index(self):
        """报名 丐帮"""
        idx, xinfa, char = self._parse_and_resolve("丐帮")
        assert idx is None
        assert xinfa == "xiaochen"
        assert char is None

    def test_xinfa_only_with_index(self):
        """报名 丐帮 1"""
        idx, xinfa, char = self._parse_and_resolve("丐帮 1")
        assert idx == 1
        assert xinfa == "xiaochen"
        assert char is None

    def test_xinfa_only_index_first(self):
        """报名 1 丐帮"""
        idx, xinfa, char = self._parse_and_resolve("1 丐帮")
        assert idx == 1
        assert xinfa == "xiaochen"
        assert char is None

    def test_character_only(self):
        """报名 丐箩箩 - 只写角色名"""
        idx, xinfa, char = self._parse_and_resolve("丐箩箩")
        assert idx is None
        assert xinfa is None
        assert char == "丐箩箩"

    def test_empty(self):
        """单独报名 - 空字符串"""
        idx, xinfa, char = self._parse_and_resolve("")
        assert idx is None
        assert xinfa is None
        assert char is None

    def test_kfc_alias_full(self):
        """报名 KFC 剑宝宝 2"""
        idx, xinfa, char = self._parse_and_resolve("KFC 剑宝宝 2")
        assert idx == 2
        assert xinfa == "wenshui"
        assert char == "剑宝宝"

    def test_healer_with_index(self):
        """报名 奶花 花花 3"""
        idx, xinfa, char = self._parse_and_resolve("奶花 花花 3")
        assert idx == 3
        assert xinfa == "lijing"
        assert char == "花花"
