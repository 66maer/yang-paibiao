"""基于关键词和正则的解析策略"""
import re
from typing import Optional, Dict, Any, List
from .base import MessageParser, ParsedIntent
from ...data.xinfa import is_xinfa_name, normalize_xinfa_name


class KeywordParser(MessageParser):
    """基于关键词和正则的解析策略"""

    async def parse(self, message: str, context: Dict[str, Any]) -> Optional[ParsedIntent]:
        """
        解析消息

        Args:
            message: 用户消息
            context: 上下文信息

        Returns:
            ParsedIntent or None
        """
        message = message.strip()

        # 尝试解析报名命令
        if message.startswith("报名"):
            return self._parse_signup(message)

        # 尝试解析代报名命令
        if message.startswith("代报名"):
            return self._parse_proxy_signup(message)

        # 尝试解析登记老板命令
        if message.startswith("登记老板"):
            return self._parse_register_rich(message)

        # 尝试解析取消报名命令
        if message.startswith("取消报名") or message.startswith("取消"):
            return self._parse_cancel_signup(message)

        return None

    def _parse_signup(self, message: str) -> Optional[ParsedIntent]:
        """
        解析报名命令

        支持格式:
        - 报名 1 藏剑 黄鸡角色 (心法 + 角色名)
        - 报名 1 黄鸡角色 藏剑 (角色名 + 心法)
        - 报名 1 黄鸡角色 (仅角色名)
        - 报名 1 藏剑 (仅心法)

        Args:
            message: 消息内容

        Returns:
            ParsedIntent or None
        """
        # 正则匹配: 报名 + 数字 + 可选的后续内容
        pattern = r'^报名\s+(\d+)(?:\s+(.+))?$'
        match = re.match(pattern, message)

        if not match:
            return ParsedIntent(
                action="signup",
                params={"error": "格式错误,正确格式:报名 [序号] [心法/角色名]"}
            )

        team_index = int(match.group(1))
        rest = match.group(2)

        params = {"team_index": team_index}

        if not rest:
            # 没有提供心法或角色名
            return ParsedIntent(
                action="signup",
                params={**params, "error": "请提供心法或角色名"}
            )

        # 分词处理
        parts = rest.strip().split()

        if len(parts) == 1:
            # 只有一个参数，判断是心法还是角色名
            word = parts[0]
            if is_xinfa_name(word):
                params["xinfa"] = normalize_xinfa_name(word)
                params["mode"] = "xinfa_only"
            else:
                params["character_name"] = word
                params["mode"] = "character_only"

        elif len(parts) == 2:
            # 两个参数，判断哪个是心法
            word1, word2 = parts

            is_word1_xinfa = is_xinfa_name(word1)
            is_word2_xinfa = is_xinfa_name(word2)

            if is_word1_xinfa and not is_word2_xinfa:
                # 第一个是心法，第二个是角色名
                params["xinfa"] = normalize_xinfa_name(word1)
                params["character_name"] = word2
                params["mode"] = "xinfa_and_character"

            elif is_word2_xinfa and not is_word1_xinfa:
                # 第二个是心法，第一个是角色名
                params["xinfa"] = normalize_xinfa_name(word2)
                params["character_name"] = word1
                params["mode"] = "character_and_xinfa"

            elif is_word1_xinfa and is_word2_xinfa:
                # 两个都是心法，不合理
                return ParsedIntent(
                    action="signup",
                    params={**params, "error": "提供了两个心法名,请检查输入"}
                )

            else:
                # 两个都不是心法，可能是多个词组成的角色名
                # 将它们合并为角色名
                params["character_name"] = f"{word1} {word2}"
                params["mode"] = "character_only"

        else:
            # 超过两个参数，可能是多个词组成的角色名
            # 检查是否有心法名
            xinfa_parts = []
            other_parts = []

            for part in parts:
                if is_xinfa_name(part):
                    xinfa_parts.append(part)
                else:
                    other_parts.append(part)

            if len(xinfa_parts) == 1:
                # 有一个心法，其余是角色名
                params["xinfa"] = normalize_xinfa_name(xinfa_parts[0])
                params["character_name"] = " ".join(other_parts)
                params["mode"] = "xinfa_and_character"
            elif len(xinfa_parts) == 0:
                # 没有心法，全部是角色名
                params["character_name"] = " ".join(parts)
                params["mode"] = "character_only"
            else:
                # 多个心法，不合理
                return ParsedIntent(
                    action="signup",
                    params={**params, "error": "提供了多个心法名,请检查输入"}
                )

        return ParsedIntent(action="signup", params=params)

    def _parse_proxy_signup(self, message: str) -> Optional[ParsedIntent]:
        """
        解析代报名命令

        支持格式:
        - 代报名 1 张三 藏剑 黄鸡角色
        - 代报名 1 张三 藏剑

        Args:
            message: 消息内容

        Returns:
            ParsedIntent or None
        """
        # 正则匹配: 代报名 + 数字 + 用户名 + 可选的心法/角色
        pattern = r'^代报名\s+(\d+)(?:\s+(.+))?$'
        match = re.match(pattern, message)

        if not match:
            return ParsedIntent(
                action="proxy_signup",
                params={"error": "格式错误,正确格式:代报名 [序号] [用户名] [心法/角色名]"}
            )

        team_index = int(match.group(1))
        rest = match.group(2)

        params = {"team_index": team_index, "is_proxy": True}

        if not rest:
            return ParsedIntent(
                action="proxy_signup",
                params={**params, "error": "请提供被代报名的用户名"}
            )

        # 分词处理
        parts = rest.strip().split()

        if len(parts) < 1:
            return ParsedIntent(
                action="proxy_signup",
                params={**params, "error": "请提供被代报名的用户名"}
            )

        # 第一个参数是被代报名的用户名
        params["proxy_user_name"] = parts[0]

        # 剩余参数按照报名逻辑处理
        if len(parts) == 1:
            # 只有用户名，没有心法或角色
            return ParsedIntent(
                action="proxy_signup",
                params={**params, "error": "请提供心法或角色名"}
            )

        elif len(parts) == 2:
            # 用户名 + 一个参数
            word = parts[1]
            if is_xinfa_name(word):
                params["xinfa"] = normalize_xinfa_name(word)
                params["mode"] = "xinfa_only"
            else:
                params["character_name"] = word
                params["mode"] = "character_only"

        elif len(parts) >= 3:
            # 用户名 + 两个或更多参数
            remaining_parts = parts[1:]
            word1, word2 = remaining_parts[0], remaining_parts[1]

            is_word1_xinfa = is_xinfa_name(word1)
            is_word2_xinfa = is_xinfa_name(word2)

            if is_word1_xinfa and not is_word2_xinfa:
                # 心法 + 角色名
                params["xinfa"] = normalize_xinfa_name(word1)
                params["character_name"] = " ".join(remaining_parts[1:])
                params["mode"] = "xinfa_and_character"

            elif is_word2_xinfa and not is_word1_xinfa:
                # 角色名 + 心法
                params["xinfa"] = normalize_xinfa_name(word2)
                params["character_name"] = " ".join([word1] + remaining_parts[2:])
                params["mode"] = "character_and_xinfa"

            else:
                # 都不是心法，或都是心法
                # 将所有剩余部分当作角色名
                params["character_name"] = " ".join(remaining_parts)
                params["mode"] = "character_only"

        return ParsedIntent(action="proxy_signup", params=params)

    def _parse_register_rich(self, message: str) -> Optional[ParsedIntent]:
        """
        解析登记老板命令

        支持格式:
        - 登记老板 1 张三 藏剑 黄鸡角色
        - 登记老板 1 张三 藏剑

        逻辑与代报名完全相同，只是标记为 is_rich=True

        Args:
            message: 消息内容

        Returns:
            ParsedIntent or None
        """
        # 将 "登记老板" 替换为 "代报名" 然后复用解析逻辑
        modified_message = message.replace("登记老板", "代报名", 1)
        intent = self._parse_proxy_signup(modified_message)

        if intent:
            intent.action = "register_rich"
            intent.params["is_rich"] = True

        return intent

    def _parse_cancel_signup(self, message: str) -> Optional[ParsedIntent]:
        """
        解析取消报名命令

        支持格式:
        - 取消报名 1 [编号/心法/角色名]
        - 取消 1 [编号/心法/角色名]

        Args:
            message: 消息内容

        Returns:
            ParsedIntent or None
        """
        # 正则匹配: (取消报名|取消) + 数字 + 可选标识符
        pattern = r'^(?:取消报名|取消)\s+(\d+)(?:\s+(.+))?$'
        match = re.match(pattern, message)

        if not match:
            return ParsedIntent(
                action="cancel_signup",
                params={"error": "格式错误,正确格式:取消报名 [序号] [可选:编号/心法/角色名]"}
            )

        team_index = int(match.group(1))
        identifier = match.group(2)

        params = {
            "team_index": team_index,
            "identifier": identifier.strip() if identifier else None
        }

        return ParsedIntent(action="cancel_signup", params=params)
