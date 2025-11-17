package service

import (
	"context"
	"encoding/json"
	"errors"

	"gorm.io/gorm"

	"github.com/go-dev-frame/sponge/pkg/logger"
	"github.com/go-dev-frame/sponge/pkg/sgorm/query"

	"XiaoYang/internal/dao"
	"XiaoYang/internal/database"
	"XiaoYang/internal/model"
)

// DungeonStatsService 副本统计服务
type DungeonStatsService struct {
	teamsDao        dao.TeamsDao
	dungeonStatsDao dao.DungeonStatsDao
	db              *gorm.DB
}

// NewDungeonStatsService 创建副本统计服务
func NewDungeonStatsService(teamsDao dao.TeamsDao, dungeonStatsDao dao.DungeonStatsDao) *DungeonStatsService {
	return &DungeonStatsService{
		teamsDao:        teamsDao,
		dungeonStatsDao: dungeonStatsDao,
		db:              database.GetDB(),
	}
}

// SummaryData 团队总结数据结构
type SummaryData struct {
	Salary          int      `json:"salary"`
	PerPersonSalary int      `json:"perPersonSalary"`
	SpecialDrops    []string `json:"specialDrops"`
	Blacklist       string   `json:"blacklist"`
}

// UpdateStatsForTeam 更新指定团队对应副本的统计数据
func (s *DungeonStatsService) UpdateStatsForTeam(ctx context.Context, guildID int, dungeonName string) error {
	// 使用事务确保数据一致性
	return s.db.Transaction(func(tx *gorm.DB) error {
		return s.updateStatsInTx(ctx, tx, guildID, dungeonName)
	})
}

// updateStatsInTx 在事务中更新统计数据
func (s *DungeonStatsService) updateStatsInTx(ctx context.Context, tx *gorm.DB, guildID int, dungeonName string) error {
	// 查询该公会该副本的所有已关闭团队
	params := &query.Params{
		Page:  0,
		Limit: 10000, // 设置一个较大的值以获取所有记录
		Columns: []query.Column{
			{
				Name:  "guild_id",
				Exp:   "=",
				Value: guildID,
			},
			{
				Name:  "dungeons",
				Exp:   "=",
				Value: dungeonName,
			},
			{
				Name:     "close_time",
				Exp:      "isnotnull",
				Value:    "",
				Logic:    "and",
			},
		},
		Sort: "ignore count", // 不需要count
	}

	teams, _, err := s.teamsDao.GetByColumns(ctx, params)
	if err != nil {
		logger.Error("GetByColumns error", logger.Err(err))
		return err
	}

	// 如果没有团队记录，删除统计数据（如果存在）
	if len(teams) == 0 {
		// 尝试删除可能存在的统计记录
		stats, err := s.dungeonStatsDao.GetByGuildAndDungeon(ctx, guildID, dungeonName)
		if err == nil && stats != nil {
			return s.dungeonStatsDao.DeleteByTx(ctx, tx, stats.ID)
		}
		return nil
	}

	// 计算统计数据
	var (
		totalCount           = 0
		minSalary            = int(^uint(0) >> 1) // 最大整数
		maxSalary            = 0
		totalSalary          = int64(0)
		minPerPersonSalary   = int(^uint(0) >> 1)
		maxPerPersonSalary   = 0
		totalPerPersonSalary = int64(0)
		minSalaryTeamID      *int
		maxSalaryTeamID      *int
	)

	for _, team := range teams {
		if team.Summary == nil {
			continue
		}

		var summary SummaryData
		err := json.Unmarshal([]byte(team.Summary.String()), &summary)
		if err != nil {
			logger.Warn("Failed to unmarshal summary", logger.Err(err), logger.Any("teamId", team.ID))
			continue
		}

		// 只统计有效的金额记录
		if summary.Salary <= 0 && summary.PerPersonSalary <= 0 {
			continue
		}

		totalCount++
		salary := summary.Salary
		perPersonSalary := summary.PerPersonSalary

		// 更新总金团统计
		if salary > 0 {
			totalSalary += int64(salary)
			if salary < minSalary {
				minSalary = salary
				teamID := int(team.ID)
				minSalaryTeamID = &teamID
			}
			if salary > maxSalary {
				maxSalary = salary
				teamID := int(team.ID)
				maxSalaryTeamID = &teamID
			}
		}

		// 更新人均金团统计
		if perPersonSalary > 0 {
			totalPerPersonSalary += int64(perPersonSalary)
			if perPersonSalary < minPerPersonSalary {
				minPerPersonSalary = perPersonSalary
			}
			if perPersonSalary > maxPerPersonSalary {
				maxPerPersonSalary = perPersonSalary
			}
		}
	}

	// 如果没有有效的统计数据，返回
	if totalCount == 0 {
		return nil
	}

	// 计算平均值
	avgSalary := float64(totalSalary) / float64(totalCount)
	avgPerPersonSalary := float64(totalPerPersonSalary) / float64(totalCount)

	// 如果minSalary没有被更新（仍是初始值），设置为0
	if minSalary == int(^uint(0)>>1) {
		minSalary = 0
	}
	if minPerPersonSalary == int(^uint(0)>>1) {
		minPerPersonSalary = 0
	}

	// 创建或更新统计记录
	stats := &model.DungeonStats{
		GuildID:              guildID,
		DungeonName:          dungeonName,
		TotalCount:           totalCount,
		MinSalary:            minSalary,
		MaxSalary:            maxSalary,
		AvgSalary:            avgSalary,
		MinPerPersonSalary:   minPerPersonSalary,
		MaxPerPersonSalary:   maxPerPersonSalary,
		AvgPerPersonSalary:   avgPerPersonSalary,
		MinSalaryTeamID:      minSalaryTeamID,
		MaxSalaryTeamID:      maxSalaryTeamID,
	}

	// 使用upsert更新或插入统计数据
	err = s.dungeonStatsDao.UpsertStatsByTx(ctx, tx, stats)
	if err != nil {
		logger.Error("UpsertStatsByTx error", logger.Err(err))
		return err
	}

	return nil
}

// GetStatsByGuildAndDungeon 获取指定公会和副本的统计数据
func (s *DungeonStatsService) GetStatsByGuildAndDungeon(ctx context.Context, guildID int, dungeonName string) (*model.DungeonStats, error) {
	stats, err := s.dungeonStatsDao.GetByGuildAndDungeon(ctx, guildID, dungeonName)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 如果统计数据不存在，尝试生成
			err = s.UpdateStatsForTeam(ctx, guildID, dungeonName)
			if err != nil {
				return nil, err
			}
			// 重新获取
			return s.dungeonStatsDao.GetByGuildAndDungeon(ctx, guildID, dungeonName)
		}
		return nil, err
	}
	return stats, nil
}

// GetAllStatsByGuild 获取指定公会的所有副本统计数据
func (s *DungeonStatsService) GetAllStatsByGuild(ctx context.Context, guildID int) ([]*model.DungeonStats, error) {
	params := &query.Params{
		Page:  0,
		Limit: 1000,
		Columns: []query.Column{
			{
				Name:  "guild_id",
				Exp:   "=",
				Value: guildID,
			},
		},
		Sort: "dungeon_name",
	}

	stats, _, err := s.dungeonStatsDao.GetByColumns(ctx, params)
	if err != nil {
		return nil, err
	}
	return stats, nil
}
