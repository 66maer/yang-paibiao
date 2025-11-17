package model

import (
	"time"
)

// DungeonStats 副本统计数据
type DungeonStats struct {
	ID                   uint64     `gorm:"column:id;type:int4;primary_key" json:"id"`                                                 // 统计ID
	GuildID              int        `gorm:"column:guild_id;type:int4;not null" json:"guildID"`                                         // 群组ID
	DungeonName          string     `gorm:"column:dungeon_name;type:varchar(50);not null" json:"dungeonName"`                          // 副本名称
	TotalCount           int        `gorm:"column:total_count;type:int4;not null;default:0" json:"totalCount"`                         // 总记录数
	MinSalary            int        `gorm:"column:min_salary;type:int4;not null;default:0" json:"minSalary"`                           // 最低总金团
	MaxSalary            int        `gorm:"column:max_salary;type:int4;not null;default:0" json:"maxSalary"`                           // 最高总金团
	AvgSalary            float64    `gorm:"column:avg_salary;type:decimal(10,2);not null;default:0" json:"avgSalary"`                  // 平均总金团
	MinPerPersonSalary   int        `gorm:"column:min_per_person_salary;type:int4;not null;default:0" json:"minPerPersonSalary"`       // 最低人均金团
	MaxPerPersonSalary   int        `gorm:"column:max_per_person_salary;type:int4;not null;default:0" json:"maxPerPersonSalary"`       // 最高人均金团
	AvgPerPersonSalary   float64    `gorm:"column:avg_per_person_salary;type:decimal(10,2);not null;default:0" json:"avgPerPersonSalary"` // 平均人均金团
	MinSalaryTeamID      *int       `gorm:"column:min_salary_team_id;type:int4" json:"minSalaryTeamID"`                                // 最低金团对应的团队ID
	MaxSalaryTeamID      *int       `gorm:"column:max_salary_team_id;type:int4" json:"maxSalaryTeamID"`                                // 最高金团对应的团队ID
	CreateTime           *time.Time `gorm:"column:create_time;type:timestamp" json:"createTime"`                                       // 创建时间
	UpdateTime           *time.Time `gorm:"column:update_time;type:timestamp" json:"updateTime"`                                       // 更新时间
}
