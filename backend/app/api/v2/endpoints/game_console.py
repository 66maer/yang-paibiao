"""
Game Console API - 卡牌活动控制台
"""
import os
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, status

from app.schemas.game_console import PublishCardRequest
from app.schemas.common import ResponseModel

router = APIRouter()

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://frontend:3000")
BOT_API_URL = "http://bot:8080/api/send-card"


@router.post("/game/publish-card", response_model=ResponseModel)
async def publish_card(payload: PublishCardRequest):
    """发布卡牌到QQ群"""

    # 拼接截图 URL
    params = {
        "type": payload.card_type,
        "name": payload.card_name,
        "desc": payload.desc,
    }
    if payload.enhanced:
        params["enhanced"] = payload.enhanced
    if payload.note:
        params["note"] = payload.note
    if payload.image_dir:
        params["image_dir"] = payload.image_dir

    screenshot_url = f"{FRONTEND_URL}/games/2026/card?{urlencode(params)}"

    # 构建文本消息
    text = f"{payload.target_team}队抽卡："
    if payload.detail:
        text += f"\n{payload.detail}"
    else:
        text += f"\n[{payload.card_type}] {payload.card_name}\n{payload.desc}"

    # 调用 Bot API
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                BOT_API_URL,
                json={
                    "url": screenshot_url,
                    "group_id": payload.qq_group_number,
                    "text": text,
                },
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Bot API 错误: {e.response.text}",
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Bot API 调用失败: {str(e)}",
        ) from e

    return ResponseModel(message="发布成功", data={"screenshot_url": screenshot_url})
