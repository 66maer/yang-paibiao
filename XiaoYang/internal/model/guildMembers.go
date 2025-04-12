package model

type GuildMembers struct {
	ID            uint64 `gorm:"column:id;type:int4;primary_key" json:"id"`                   // 关联ID
	GuildID       int    `gorm:"column:guild_id;type:int4;not null" json:"guildID"`           // 群组ID
	MemberID      int    `gorm:"column:member_id;type:int4;not null" json:"memberID"`         // 成员ID
	Role          string `gorm:"column:role;type:varchar(20);not null" json:"role"`           // 角色
	GroupNickname string `gorm:"column:group_nickname;type:varchar(50)" json:"groupNickname"` // 群内昵称
}
