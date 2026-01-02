"""
通用响应模型
"""
from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field

# 泛型数据类型
DataT = TypeVar("DataT")


class Response(BaseModel, Generic[DataT]):
    """
    统一响应模型

    成功示例:
    {
        "code": 200,
        "message": "操作成功",
        "data": {...}
    }

    失败示例:
    {
        "code": 400,
        "message": "参数错误",
        "data": null
    }
    """
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="success", description="响应消息")
    data: Optional[DataT] = Field(default=None, description="响应数据")

    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "操作成功",
                "data": None
            }
        }


class PageData(BaseModel, Generic[DataT]):
    """
    分页数据模型
    """
    total: int = Field(description="总记录数")
    page: int = Field(description="当前页码")
    page_size: int = Field(description="每页大小")
    items: list[DataT] = Field(description="数据列表")

    class Config:
        json_schema_extra = {
            "example": {
                "total": 100,
                "page": 1,
                "page_size": 10,
                "items": []
            }
        }


class PaginatedResponse(BaseModel, Generic[DataT]):
    """
    分页响应模型（与 PageData 类似，但包含 pages 字段）
    """
    items: list[DataT] = Field(description="数据列表")
    total: int = Field(description="总记录数")
    page: int = Field(description="当前页码")
    page_size: int = Field(description="每页大小")
    pages: int = Field(description="总页数")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "page_size": 20,
                "pages": 5
            }
        }


class PageParams(BaseModel):
    """
    分页参数模型
    """
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页大小")

    @property
    def offset(self) -> int:
        """计算偏移量"""
        return (self.page - 1) * self.page_size


def success(data: Any = None, message: str = "操作成功") -> dict:
    """成功响应辅助函数"""
    return Response(code=200, message=message, data=data).model_dump()


def error(message: str = "操作失败", code: int = 400, data: Any = None) -> dict:
    """错误响应辅助函数"""
    return Response(code=code, message=message, data=data).model_dump()


# 别名，方便使用
ResponseModel = Response
