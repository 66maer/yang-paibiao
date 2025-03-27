package model

import (
	"XiaoYang/internal/utils"
	"time"

	"gorm.io/datatypes"
)

type Guilds struct {
	ID            uint64          `gorm:"column:id;type:int4;primary_key" json:"id"`                             // 群组ID
	GuildQqNumber string          `gorm:"column:guild_qq_number;type:varchar(20);not null" json:"guildQqNumber"` // 群号
	Ukey          string          `gorm:"column:ukey;type:varchar(20);not null" json:"ukey"`                     // 群组唯一标识
	Name          string          `gorm:"column:name;type:varchar(50);not null" json:"name"`                     // 群组名
	Server        string          `gorm:"column:server;type:varchar(30);not null" json:"server"`                 // 群组所在服务器
	Avatar        string          `gorm:"column:avatar;type:varchar(100)" json:"avatar"`                         // 群组头像
	ExpireTime    *time.Time      `gorm:"column:expire_time;type:timestamp" json:"-"`                            // 过期时间
	Preferences   *datatypes.JSON `gorm:"column:preferences;type:jsonb" json:"-"`                                // 群组偏好设置
}

// GetExpireTime 获取过期时间（uint64 格式）
func (g *Guilds) GetExpireTime() uint64 {
	return utils.TimePtrToUint64(g.ExpireTime)
}

// SetExpireTime 设置过期时间（uint64 格式）
func (g *Guilds) SetExpireTime(t uint64) {
	g.ExpireTime = utils.Uint64ToTimePtr(t)
}

// GetPreferences 获取偏好设置（string 格式）
func (g *Guilds) GetPreferences() string {
	return utils.JSONPtrToString(g.Preferences)
}

// SetPreferences 设置偏好设置（string 格式）
func (g *Guilds) SetPreferences(s string) {
	g.Preferences = utils.StringToJSONPtr(s)
}
