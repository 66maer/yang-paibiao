package model

import (
	"time"

	"gorm.io/datatypes"
)

type Teams struct {
	ID           uint64          `gorm:"column:id;type:int4;primary_key" json:"id"`                   // 开团ID
	GuildID      int             `gorm:"column:guild_id;type:int4;not null" json:"guildID"`           // 群组ID
	CreaterID    int             `gorm:"column:creater_id;type:int4;not null" json:"createrID"`       // 创建者ID
	Title        string          `gorm:"column:title;type:varchar(100);not null" json:"title"`        // 开团标题
	TeamTime     *time.Time      `gorm:"column:team_time;type:timestamp;not null" json:"teamTime"`    // 开团时间
	Dungeons     string          `gorm:"column:dungeons;type:varchar(50);not null" json:"dungeons"`   // 副本名称
	BookXuanjing bool            `gorm:"column:book_xuanjing;type:bool;not null" json:"bookXuanjing"` // 是否有人预定玄晶
	BookYuntie   bool            `gorm:"column:book_yuntie;type:bool;not null" json:"bookYuntie"`     // 是否有人预定陨铁
	IsHidden     bool            `gorm:"column:is_hidden;type:bool;not null" json:"IsHidden"`         // 是否对外可见
	IsLock       bool            `gorm:"column:is_lock;type:bool;not null" json:"isLock"`             // 是否锁定
	Rule         *datatypes.JSON `gorm:"column:rule;type:jsonb;not null" json:"rule"`                 // 报名规则
	Notice       string          `gorm:"column:notice;type:text" json:"notice"`                       // 团队告示
	CreateTime   *time.Time      `gorm:"column:create_time;type:timestamp" json:"createTime"`         // 创建时间
	UpdateTime   *time.Time      `gorm:"column:update_time;type:timestamp" json:"updateTime"`         // 更新时间
	CloseTime    *time.Time      `gorm:"column:close_time;type:timestamp" json:"closeTime"`           // 关闭时间
	CloseID      int             `gorm:"column:close_id;type:int4" json:"closeID"`                    // 关闭者ID
	Summary      *datatypes.JSON `gorm:"column:summary;type:jsonb" json:"summary"`                    // 团队总结
}
