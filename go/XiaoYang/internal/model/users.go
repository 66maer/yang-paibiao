package model

type Users struct {
	ID              uint64 `gorm:"column:id;type:int4;primary_key" json:"id"`                  // 用户ID
	QqNumber        string `gorm:"column:qq_number;type:varchar(20);not null" json:"qqNumber"` // QQ号
	Password        string `gorm:"column:password;type:varchar(255);not null" json:"password"` // 密码的哈希值
	Nickname        string `gorm:"column:nickname;type:varchar(50);not null" json:"nickname"`  // 昵称
	Avatar          string `gorm:"column:avatar;type:varchar(100)" json:"avatar"`              // 头像
	IsAdmin         bool   `gorm:"column:is_admin;type:bool" json:"isAdmin"`                   // 是否为管理员
	IsBot           bool   `gorm:"column:is_bot;type:bool" json:"isBot"`                       // 是否为机器人
	IsResetPassword bool   `gorm:"column:is_reset_password;type:bool" json:"isResetPassword"`  // 是否需要重置密码
}
