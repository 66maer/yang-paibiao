"""
每周记录相关的 Schema 定义
"""
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ColumnConfig(BaseModel):
    """列配置项"""
    name: str = Field(..., description="副本名称")
    type: str = Field(..., description="类型: primary(主要副本) 或 custom(自定义)")
    order: int = Field(default=0, description="排序顺序")


class WeeklyRecordConfigCreate(BaseModel):
    """创建/更新每周列配置"""
    columns: List[ColumnConfig] = Field(..., description="列配置列表")


class WeeklyRecordConfigResponse(BaseModel):
    """每周列配置响应"""
    id: int
    user_id: int
    week_start_date: date
    columns: List[ColumnConfig]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WeeklyRecordUpdate(BaseModel):
    """更新单元格数据"""
    is_cleared: Optional[bool] = Field(None, description="是否通关")
    gold_amount: Optional[int] = Field(None, ge=0, description="人均金团金额")


class WeeklyRecordCreate(BaseModel):
    """创建每周记录"""
    character_id: int = Field(..., description="角色ID")
    dungeon_name: str = Field(..., description="副本名称")
    is_cleared: bool = Field(default=False, description="是否通关")
    gold_amount: int = Field(default=0, ge=0, description="人均金团金额")


class CharacterInfo(BaseModel):
    """角色简要信息"""
    id: int
    name: str
    server: str
    xinfa: str
    remark: Optional[str] = None


class WeeklyRecordResponse(BaseModel):
    """每周记录响应"""
    id: int
    user_id: int
    character_id: int
    week_start_date: date
    dungeon_name: str
    is_cleared: bool
    gold_amount: int
    gold_record_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CellData(BaseModel):
    """单元格数据"""
    record_id: Optional[int] = None
    is_cleared: bool = False
    gold_amount: int = 0
    gold_record_id: Optional[int] = None


class CharacterRowData(BaseModel):
    """角色行数据"""
    character: CharacterInfo
    cells: dict[str, CellData]  # key: dungeon_name, value: CellData
    row_total: int = 0  # 该行总金额


class WeeklyMatrixResponse(BaseModel):
    """每周记录矩阵响应"""
    week_start_date: date
    is_current_week: bool
    columns: List[ColumnConfig]
    rows: List[CharacterRowData]
    column_totals: dict[str, int]  # key: dungeon_name, value: total
    grand_total: int = 0  # 总计


class WeekOption(BaseModel):
    """周选项"""
    week_start_date: date
    label: str  # 如 "2026-01-06 ~ 2026-01-12"
    is_current: bool = False
