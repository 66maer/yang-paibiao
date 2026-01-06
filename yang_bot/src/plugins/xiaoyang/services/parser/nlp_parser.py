"""基于大语言模型的 NLP 解析器（增强版）"""
import json
import re
from typing import Optional, Dict, Any, List
import httpx
from nonebot.log import logger

from .base import MessageParser, ParsedIntent
from ..session_manager import get_session_manager


# 心法别名映射表（JSON格式，供系统提示词使用）
XINFA_ALIAS_MAP = {
    "huajian": ["花间", "花间游"],
    "lijing": ["奶花", "离经易道", "离经", "花奶"],
    "binxin": ["冰心", "冰心诀", "冰心决"],
    "yunchang": ["奶秀", "云裳心经", "云裳", "秀奶"],
    "yijin": ["和尚", "易筋经", "易筋", "秃子"],
    "xisui": ["和尚T", "洗髓经", "洗髓", "秃T"],
    "zixia": ["气纯", "紫霞功", "紫霞"],
    "taixu": ["剑纯", "太虚剑意", "备胎"],
    "aoxue": ["天策", "傲血战意", "傲血", "狗子"],
    "tielao": ["策T", "铁牢律", "铁牢", "天策T"],
    "wenshui": ["藏剑", "问水诀", "问水", "问水决", "黄鸡", "叽", "黄叽", "鸡"],
    "dujing": ["毒经", "五毒"],
    "butian": ["奶毒", "补天诀", "毒奶"],
    "jingyu": ["鲸鱼", "惊羽诀", "惊羽", "惊羽决"],
    "tianluo": ["田螺", "天罗诡道", "天罗"],
    "fenying": ["焚影", "焚影圣诀", "喵", "喵喵", "明教"],
    "mingzun": ["喵T", "明尊琉璃体", "明尊", "明教T"],
    "xiaochen": ["丐帮", "笑尘诀"],
    "fenshan": ["苍云", "分山劲", "分山", "岔劲", "乌龟", "龟龟", "盾盾"],
    "tiegu": ["苍云T", "铁骨衣", "铁骨"],
    "mowen": ["莫问", "长歌"],
    "xiangzhi": ["奶歌", "相知", "歌奶", "奶鸽", "鸽奶", "奶咕", "咕奶"],
    "beiao": ["霸刀", "北傲诀", "貂貂"],
    "linghai": ["蓬莱", "凌海诀", "凌海决", "伞"],
    "yinlong": ["凌雪", "凌血", "0雪", "隐龙诀", "凌雪阁"],
    "taixuan": ["衍天", "太玄经", "衍天宗", "灯灯", "灯"],
    "wufang": ["无方", "药宗"],
    "lingsu": ["奶药", "药奶", "灵素"],
    "gufeng": ["刀宗", "孤峰诀", "孤峰决"],
    "shanhai": ["万灵", "山海心诀", "弓"],
    "zhoutian": ["段氏", "周天功", "扇子", "扇"],
    "youluo": ["幽罗", "幽罗引", "无相楼", "无相", "五香楼", "五香"],
}


class NLPParser(MessageParser):
    """基于大模型的 NLP 解析器（支持多轮对话和上下文）"""

    # 预过滤关键词
    TRIGGER_KEYWORDS: List[str] = [
        "报", "报名", "代报", "老板", 
        "车", "坑", "打"
    ]

    # 排除的询问类正则模式
    EXCLUDE_PATTERNS: List[str] = [
        r"有.*吗[？?]?$",
        r"还有.*吗[？?]?$",
        r".*多少.*[？?]$",
        r"什么时候",
        r"几点",
    ]

    def __init__(
        self,
        api_base: str,
        api_key: str,
        model: str = "qwen-plus",
        timeout: int = 15,
        max_tokens: int = 512,
        temperature: float = 0.1,
        max_history: int = 5,
        session_timeout: int = 180,
    ):
        self.api_base = api_base.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.max_history = max_history
        self.session_timeout = session_timeout
        self._system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        """构建系统提示词"""
        xinfa_json = json.dumps(XINFA_ALIAS_MAP, ensure_ascii=False, indent=2)

        return f'''你是剑网三游戏群组的报名助手，负责解析玩家的报名意图。

## 术语说明
- 车/本/团：均指一次副本活动
- 坑位：团队中的一个报名位置

## 意图类型
- signup: 自己报名（例："报1藏剑"、"1车打个黄鸡"、"1车黄鸡"）
- proxy_signup: 帮别人报名（例："帮张三报1藏剑"、"代报1张三花间"）
- register_rich: 登记老板（例："登记老板1张三奶花"）
- cancel_signup: 取消报名（例："取消报名1"）
- irrelevant: 无报名意图

## 心法映射表
```json
{xinfa_json}
```

## 输出格式
严格返回 JSON，不要有其他内容：
```json
{{
  "intent": "signup|proxy_signup|register_rich|cancel_signup|irrelevant",
  "need_followup": false,
  "followup_question": null,
  "team_index": 1,
  "xinfa_key": "wenshui",
  "character_name": null,
  "proxy_user": null,
  "rich_user": null,
  "confidence": 0.9
}}
```

## 字段说明
- intent: 意图类型（必填）
- need_followup: 是否需要追问用户（必填）
- followup_question: 追问问题（当 need_followup=true 时必填）
- team_index: 车次/团队序号（可为null，根据上下文推断）
- xinfa_key: 心法英文key（必填，从映射表中选择）
- character_name: 角色名（可选）
- proxy_user: 被代报名的用户名（proxy_signup 时必填）
- rich_user: 老板用户名（register_rich 时可选，默认报名者自己）
- confidence: 置信度 0-1

## 智能推断规则
1. 若上下文中只有一个团队，用户不指定车次时默认该团队
2. 若用户角色列表中有该心法角色，可自动匹配（按priority排序）
3. 若用户只有一个报名记录，取消时无需指定车次/心法
4. 若信息不完整需要追问，设置 need_followup=true 并填写 followup_question
5. 询问类消息（如"有坑吗"、"几点开"）返回 irrelevant

## 重要提示
- 必须识别到强烈的报名意图才返回数据，对于模棱两可的聊天类消息返回 irrelevant
- 用户可能会闲聊时提到 报名、取消等关键词，不要误判。
'''

    def _should_call_llm(self, message: str) -> bool:
        """预过滤：判断是否需要调用 LLM"""
        has_trigger = any(kw in message for kw in self.TRIGGER_KEYWORDS)
        if not has_trigger:
            return False

        for pattern in self.EXCLUDE_PATTERNS:
            if re.search(pattern, message):
                logger.debug(f"NLP 解析器: 消息匹配排除模式 '{pattern}'，跳过")
                return False

        return True

    async def _build_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """构建上下文信息"""
        result = {
            "teams": [],
            "user_signups": [],
            "user_characters": [],
        }

        api_client = context.get("api_client")
        user_id = context.get("user_id")

        if not api_client:
            return result

        try:
            # 获取团队列表
            teams = await api_client.teams.get_teams()
            result["teams"] = [
                {
                    "index": idx + 1,
                    "id": team.id,
                    "title": team.title,
                    "time": team.team_time.strftime("%Y-%m-%d %H:%M") if team.team_time else None,
                    "dungeon": team.dungeon,
                    "signup_count": team.signup_count,
                }
                for idx, team in enumerate(teams)
            ]

            # 获取用户报名状态（遍历所有团队）
            if user_id:
                for idx, team in enumerate(teams):
                    try:
                        signups = await api_client.signups.get_user_signups(team.id, user_id)
                        for signup in signups:
                            result["user_signups"].append({
                                "team_index": idx + 1,
                                "team_id": team.id,
                                "xinfa": signup.signup_info.get("xinfa", ""),
                                "character": signup.signup_info.get("character_name", ""),
                                "is_rich": signup.is_rich,
                            })
                    except Exception as e:
                        logger.debug(f"获取用户报名状态失败: {e}")

                # 获取用户角色列表
                try:
                    characters = await api_client.characters.get_user_characters(user_id)
                    result["user_characters"] = [
                        {
                            "id": char.id,
                            "name": char.name,
                            "xinfa": char.xinfa,
                            "priority": char.priority,
                        }
                        for char in characters
                    ]
                except Exception as e:
                    logger.debug(f"获取用户角色列表失败: {e}")

        except Exception as e:
            logger.error(f"构建上下文失败: {e}")

        return result

    def _get_session_key(self, user_id: str, group_id: str) -> str:
        """获取会话键"""
        return f"nlp_{user_id}_{group_id}"

    async def parse(
        self,
        message: str,
        context: Dict[str, Any],
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Optional[ParsedIntent]:
        """
        解析消息

        Args:
            message: 用户消息
            context: 上下文信息（包含 api_client, user_id, group_id）
            history: 对话历史（可选，用于多轮对话）

        Returns:
            ParsedIntent or None
        """
        message = message.strip()

        # 如果没有历史记录，进行预过滤
        if not history and not self._should_call_llm(message):
            logger.debug(f"NLP 解析器: 消息未触发关键词，跳过: {message[:50]}")
            return None

        try:
            # 构建上下文信息（每轮重新查询）
            ctx_info = await self._build_context(context)

            # 调用 LLM
            result = await self._call_llm(message, ctx_info, history)

            if result is None:
                return None

            # 解析 LLM 响应
            return self._parse_llm_response(result, ctx_info)

        except httpx.TimeoutException:
            logger.warning(f"NLP 请求超时，消息: {message[:50]}")
            return None

        except httpx.HTTPStatusError as e:
            logger.error(f"NLP API 错误 {e.response.status_code}: {e}")
            return None

        except json.JSONDecodeError as e:
            logger.error(f"NLP 响应 JSON 解析失败: {e}")
            return None

        except Exception as e:
            logger.exception(f"NLP 解析器未知错误: {e}")
            return None

    async def _call_llm(
        self,
        message: str,
        ctx_info: Dict[str, Any],
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Optional[Dict[str, Any]]:
        """调用 LLM API"""
        url = f"{self.api_base}/chat/completions"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # 构建消息列表
        messages = [{"role": "system", "content": self._system_prompt}]

        # 添加上下文信息
        context_prompt = f"## 当前上下文\n```json\n{json.dumps(ctx_info, ensure_ascii=False, indent=2)}\n```"
        messages.append({"role": "system", "content": context_prompt})

        # 添加历史对话
        if history:
            # 限制历史长度
            trimmed_history = history[-self.max_history * 2:]
            messages.extend(trimmed_history)

        # 添加当前用户消息
        messages.append({"role": "user", "content": f"解析这条消息的报名意图：{message}"})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            logger.debug(f"NLP 响应: {content}")

            return json.loads(content)

    def _parse_llm_response(
        self,
        result: Dict[str, Any],
        ctx_info: Dict[str, Any],
    ) -> Optional[ParsedIntent]:
        """将 LLM 响应转换为 ParsedIntent"""
        intent = result.get("intent", "irrelevant")

        # 无关消息
        if intent == "irrelevant":
            return None

        confidence = result.get("confidence", 0.8)
        need_followup = result.get("need_followup", False)
        followup_question = result.get("followup_question")

        # 提取参数
        params: Dict[str, Any] = {}

        # 团队序号处理
        team_index = result.get("team_index")
        if team_index is not None:
            params["team_index"] = int(team_index)
        elif len(ctx_info.get("teams", [])) == 1:
            # 只有一个团队时自动推断
            params["team_index"] = 1
        elif not need_followup and intent != "cancel_signup":
            # 没有团队序号且不是追问状态，返回错误
            params["error"] = "未能识别团队序号，请指定车次"
            return ParsedIntent(
                action=intent,
                params=params,
                confidence=0.3,
                need_followup=True,
                followup_question="请问是哪一车？"
            )

        # 心法处理
        xinfa_key = result.get("xinfa_key")
        if xinfa_key and xinfa_key in XINFA_ALIAS_MAP:
            params["xinfa_key"] = xinfa_key
            params["mode"] = "xinfa_only"

            # 尝试从用户角色列表中匹配
            user_characters = ctx_info.get("user_characters", [])
            for char in user_characters:
                if char.get("xinfa") == xinfa_key:
                    params["character_id"] = char.get("id")
                    params["character_name"] = char.get("name")
                    params["mode"] = "xinfa_and_character"
                    break

        # 角色名（如果用户明确指定）
        character_name = result.get("character_name")
        if character_name:
            params["character_name"] = character_name
            if xinfa_key:
                params["mode"] = "xinfa_and_character"
            else:
                params["mode"] = "character_only"

        # 代报名用户
        proxy_user = result.get("proxy_user")
        if proxy_user and intent in ("proxy_signup", "register_rich"):
            params["proxy_user_name"] = proxy_user
            params["is_proxy"] = True

        # 老板用户
        rich_user = result.get("rich_user")
        if rich_user and intent == "register_rich":
            params["rich_user_name"] = rich_user

        # 老板标记
        if intent == "register_rich":
            params["is_rich"] = True

        # 取消报名的智能推断
        if intent == "cancel_signup":
            user_signups = ctx_info.get("user_signups", [])
            if len(user_signups) == 1 and "team_index" not in params:
                # 用户只有一个报名，自动推断
                params["team_index"] = user_signups[0]["team_index"]
                params["xinfa_key"] = user_signups[0].get("xinfa", "")

        return ParsedIntent(
            action=intent,
            params=params,
            confidence=confidence,
            need_followup=need_followup,
            followup_question=followup_question,
        )
