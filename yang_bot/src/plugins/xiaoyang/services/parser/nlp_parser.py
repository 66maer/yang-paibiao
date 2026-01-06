"""基于大语言模型的 NLP 解析器（重构版）

主要改进：
1. 使用配置化的提示词（支持环境变量覆盖）
2. 简化输出结构，与后端字段对齐
3. 优化上下文构建，直接使用预查询数据
4. 严格区分各种报名意图
"""
import json
import re
import httpx
from typing import Optional, Dict, Any, List
from nonebot.log import logger

from .base import MessageParser, ParsedIntent
from .prompts import build_system_prompt
from ...data.xinfa import XINFA_INFO


class NLPParser(MessageParser):
    """基于大模型的 NLP 解析器"""

    def __init__(
        self,
        api_base: str,
        api_key: str,
        model: str = "qwen-plus",
        timeout: int = 15,
        max_tokens: int = 512,
        temperature: float = 0.1,
        max_history: int = 5,
    ):
        """
        初始化 NLP 解析器
        
        Args:
            api_base: API 基础地址
            api_key: API 密钥
            model: 模型名称
            timeout: 请求超时时间
            max_tokens: 最大 token 数
            temperature: 温度参数
            max_history: 最大历史轮数
        """
        self.api_base = api_base.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.max_history = max_history
        self._system_prompt = build_system_prompt()

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
            context: 上下文信息，包含：
                - user_id: 用户 QQ 号
                - group_id: 群组 ID
                - teams: 团队列表（预查询）
                - user_characters: 用户角色列表（预查询）
                - user_signups: 用户报名列表（预查询）
            history: 对话历史（多轮对话）
        
        Returns:
            ParsedIntent or None
        """
        message = message.strip()
        
        if not message:
            return None

        try:
            # 构建简化的上下文（直接使用预查询数据）
            ctx_info = {
                "teams": context.get("teams", []),
                "user_characters": context.get("user_characters", []),
                "user_signups": context.get("user_signups", []),
            }
            
            # 打印当前上下文用于调试
            logger.info(f"[NLP上下文] teams: {ctx_info['teams']}")
            logger.info(f"[NLP上下文] user_characters: {ctx_info['user_characters']}")
            logger.info(f"[NLP上下文] user_signups: {ctx_info['user_signups']}")

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

        # 提取参数
        params: Dict[str, Any] = {}

        error_message = result.get("error_message")
        if error_message:
            return ParsedIntent(
                action=intent,
                error_message=error_message,
            )

        # 团队序号处理
        team_index = result.get("team_index")
        if team_index is not None:
            params["team_index"] = int(team_index)
        elif len(ctx_info.get("teams", [])) == 1:
            # 只有一个团队时自动推断
            params["team_index"] = 1
        else:
            # 需要追问车次
            return ParsedIntent(
                action=intent,
                params=params,
                need_followup=True,
                followup_question="请问是哪一车？"
            )

        # 心法处理（取消报名时心法可选）
        xinfa_key = result.get("xinfa_key")
        if xinfa_key and xinfa_key in XINFA_INFO:
            params["xinfa_key"] = xinfa_key
        elif intent in ("signup", "proxy_signup", "register_rich"):
            # 报名类意图必须有心法
            return ParsedIntent(
                action=intent,
                params=params,
                need_followup=True,
                followup_question="请指定心法，例如：藏剑、奶花、丐帮等"
            )
        # cancel_signup 时心法可选，不需要追问

        # 角色 ID（从用户角色列表匹配）
        character_id = result.get("character_id")
        if character_id:
            params["character_id"] = character_id

        # 角色名
        character_name = result.get("character_name")
        if character_name:
            params["character_name"] = character_name

        # 被报名用户/老板名称
        player_name = result.get("player_name")
        if player_name:
            params["player_name"] = player_name
        elif intent in ("proxy_signup", "register_rich"):
            # 代报名/登记老板必须有被报名用户昵称
            return ParsedIntent(
                action=intent,
                params=params,
                need_followup=True,
                followup_question="请提供被报名玩家的昵称"
            )
            

        # 报名 ID（用于取消报名）
        signup_id = result.get("signup_id")
        if signup_id:
            params["signup_id"] = signup_id

        return ParsedIntent(
            action=intent,
            params=params,
            need_followup=False,
            followup_question=None,
        )
