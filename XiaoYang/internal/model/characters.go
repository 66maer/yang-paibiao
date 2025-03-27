package model

type Characters struct {
	ID     uint64 `gorm:"column:id;type:int4;primary_key" json:"id"`             // 角色ID
	UserID int    `gorm:"column:user_id;type:int4;not null" json:"userID"`       // 用户ID
	Name   string `gorm:"column:name;type:varchar(50);not null" json:"name"`     // 角色名
	Server string `gorm:"column:server;type:varchar(30);not null" json:"server"` // 角色所在服务器
	Xinfa  string `gorm:"column:xinfa;type:varchar(20);not null" json:"xinfa"`   // 角色心法
	Remark string `gorm:"column:remark;type:text" json:"remark"`                 // 角色备注
}
