package model

import (
	"gorm.io/datatypes"
	"time"
)

type Signups struct {
	ID                uint64         `gorm:"column:id;type:int4;primary_key" json:"id"`                     // 报名ID
	TeamID            int            `gorm:"column:team_id;type:int4;not null" json:"teamID"`               // 开团ID
	SubmitUserID      int            `gorm:"column:submit_user_id;type:int4;not null" json:"submitUserID"`  // 提交者ID
	SignupUserID      int            `gorm:"column:signup_user_id;type:int4" json:"signupUserID"`           // 报名者ID
	SignupCharacterID int            `gorm:"column:signup_character_id;type:int4" json:"signupCharacterID"` // 报名角色ID
	SignupInfo        datatypes.JSON `gorm:"column:signup_info;type:jsonb" json:"signupInfo"`               // 报名信息
	Priority          int            `gorm:"column:priority;type:int4;not null" json:"priority"`            // 优先级
	IsRich            bool           `gorm:"column:is_rich;type:bool;not null" json:"isRich"`               // 是否是老板
	IsProxy           bool           `gorm:"column:is_proxy;type:bool;not null" json:"isProxy"`             // 是否是代报名
	ClientType        string         `gorm:"column:client_type;type:varchar(20)" json:"clientType"`         // 客户端类型
	LockSlot          int            `gorm:"column:lock_slot;type:int4" json:"lockSlot"`                    // 锁定到固定位置
	IsDove            bool           `gorm:"column:is_dove;type:bool;not null" json:"isDove"`               // 是否鸽了
	IsCandidate       bool           `gorm:"column:is_candidate;type:bool;not null" json:"isCandidate"`     // 是否是替补
	Detail            datatypes.JSON `gorm:"column:detail;type:jsonb" json:"detail"`                        // 报名详情
	SignupTime        *time.Time     `gorm:"column:signup_time;type:timestamp" json:"signupTime"`           // 报名时间
	CancelUserID      int            `gorm:"column:cancel_user_id;type:int4" json:"cancelUserID"`           // 取消者ID
	CancelTime        *time.Time     `gorm:"column:cancel_time;type:timestamp" json:"cancelTime"`           // 取消时间
}
