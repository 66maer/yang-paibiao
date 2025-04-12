package model

import (
	"gorm.io/datatypes"
	"time"
)

type TeamTemplates struct {
	ID         uint64          `gorm:"column:id;type:int4;primary_key" json:"id"`             // 模板ID
	GuildID    int             `gorm:"column:guild_id;type:int4;not null" json:"guildID"`     // 群组ID
	CreaterID  int             `gorm:"column:creater_id;type:int4;not null" json:"createrID"` // 创建者ID
	Title      string          `gorm:"column:title;type:varchar(100);not null" json:"title"`  // 模板标题
	Rule       *datatypes.JSON `gorm:"column:rule;type:jsonb;not null" json:"rule"`           // 报名规则
	Notice     string          `gorm:"column:notice;type:text" json:"notice"`                 // 团队告示
	CreateTime *time.Time      `gorm:"column:create_time;type:timestamp" json:"createTime"`   // 创建时间
	UpdateTime *time.Time      `gorm:"column:update_time;type:timestamp" json:"updateTime"`   // 更新时间
}
