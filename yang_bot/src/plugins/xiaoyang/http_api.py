"""HTTP API - 提供召唤成员等 HTTP 接口供 Backend 调用"""
from typing import List
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from nonebot import get_bot, logger
from nonebot.adapters.onebot.v11 import Bot, Message, MessageSegment
from nonebot.exception import ActionFailed

# 创建 API 路由器
api_router = APIRouter(prefix="/api", tags=["HTTP API"])


class CallMembersRequest(BaseModel):
    """召唤成员请求"""

    guild_qq_number: str = Field(..., description="QQ群号")
    qq_numbers: List[str] = Field(..., description="要召唤的QQ号列表")
    message: str = Field(default="请进组", description="召唤消息")


class CallMembersResponse(BaseModel):
    """召唤成员响应"""

    success: bool = Field(..., description="是否成功")
    count: int = Field(..., description="召唤的人数")
    message: str = Field(default="", description="响应消息")


@api_router.post("/call-members", response_model=CallMembersResponse)
async def call_members(request: CallMembersRequest) -> CallMembersResponse:
    """
    召唤成员到群聊

    Args:
        request: 召唤请求，包含群号、QQ号列表和消息

    Returns:
        CallMembersResponse: 响应结果

    Raises:
        HTTPException: 当召唤失败时
    """
    try:
        # 获取 Bot 实例
        bot: Bot = get_bot()

        # 构建消息：@user1 @user2 @user3 消息内容
        msg = Message()
        for qq_number in request.qq_numbers:
            msg += MessageSegment.at(qq_number) + " "
        msg += request.message

        # 发送群消息
        group_id = int(request.guild_qq_number)
        await bot.send_group_msg(group_id=group_id, message=msg)

        logger.info(
            f"成功召唤 {len(request.qq_numbers)} 名成员到群 {request.guild_qq_number}"
        )

        return CallMembersResponse(
            success=True,
            count=len(request.qq_numbers),
            message=f"已召唤 {len(request.qq_numbers)} 名成员",
        )

    except ActionFailed as e:
        logger.error(f"发送群消息失败: {e}")
        raise HTTPException(status_code=500, detail=f"发送群消息失败: {e}") from e

    except ValueError as e:
        logger.error(f"群号格式错误: {request.guild_qq_number}")
        raise HTTPException(status_code=400, detail="群号格式错误") from e

    except Exception as e:
        logger.exception(f"召唤成员失败: {e}")
        raise HTTPException(status_code=500, detail=f"召唤成员失败: {e}") from e
