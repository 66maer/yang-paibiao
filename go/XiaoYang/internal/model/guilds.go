package model

import (
	"gorm.io/datatypes"
	"time"
)

type Guilds struct {
	ID            uint64         `gorm:"column:id;type:int4;primary_key" json:"id"`                             // 群组ID
	GuildQqNumber string         `gorm:"column:guild_qq_number;type:varchar(20);not null" json:"guildQqNumber"` // 群号
	Ukey          string         `gorm:"column:ukey;type:varchar(20);not null" json:"ukey"`                     // 群组唯一标识
	Name          string         `gorm:"column:name;type:varchar(50);not null" json:"name"`                     // 群组名
	Server        string         `gorm:"column:server;type:varchar(30);not null" json:"server"`                 // 群组所在服务器
	Avatar        string         `gorm:"column:avatar;type:varchar(100)" json:"avatar"`                         // 群组头像
	ExpireTime    *time.Time     `gorm:"column:expire_time;type:timestamp" json:"expireTime"`                   // 过期时间
	Preferences   datatypes.JSON `gorm:"column:preferences;type:jsonb" json:"preferences"`                      // 群组偏好设置
}
