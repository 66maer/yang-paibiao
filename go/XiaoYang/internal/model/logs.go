package model

import (
	"gorm.io/datatypes"
	"time"
)

type Logs struct {
	ID         uint64         `gorm:"column:id;type:int4;primary_key" json:"id"`             // 日志ID
	UserID     int            `gorm:"column:user_id;type:int4;not null" json:"userID"`       // 用户ID
	GuildID    int            `gorm:"column:guild_id;type:int4" json:"guildID"`              // 群组ID
	Action     string         `gorm:"column:action;type:varchar(50);not null" json:"action"` // 操作
	Detail     datatypes.JSON `gorm:"column:detail;type:jsonb" json:"detail"`                // 详情
	CreateTime *time.Time     `gorm:"column:create_time;type:timestamp" json:"createTime"`   // 创建时间
}
