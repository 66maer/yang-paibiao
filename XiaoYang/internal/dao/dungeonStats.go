package dao

import (
	"context"
	"errors"

	"golang.org/x/sync/singleflight"
	"gorm.io/gorm"

	"github.com/go-dev-frame/sponge/pkg/logger"
	"github.com/go-dev-frame/sponge/pkg/sgorm/query"
	"github.com/go-dev-frame/sponge/pkg/utils"

	"XiaoYang/internal/cache"
	"XiaoYang/internal/database"
	"XiaoYang/internal/model"
)

var _ DungeonStatsDao = (*dungeonStatsDao)(nil)

// DungeonStatsDao defining the dao interface
type DungeonStatsDao interface {
	Create(ctx context.Context, table *model.DungeonStats) error
	DeleteByID(ctx context.Context, id uint64) error
	UpdateByID(ctx context.Context, table *model.DungeonStats) error
	GetByID(ctx context.Context, id uint64) (*model.DungeonStats, error)
	GetByGuildAndDungeon(ctx context.Context, guildID int, dungeonName string) (*model.DungeonStats, error)
	GetByColumns(ctx context.Context, params *query.Params) ([]*model.DungeonStats, int64, error)
	UpsertStats(ctx context.Context, stats *model.DungeonStats) error

	CreateByTx(ctx context.Context, tx *gorm.DB, table *model.DungeonStats) (uint64, error)
	DeleteByTx(ctx context.Context, tx *gorm.DB, id uint64) error
	UpdateByTx(ctx context.Context, tx *gorm.DB, table *model.DungeonStats) error
	UpsertStatsByTx(ctx context.Context, tx *gorm.DB, stats *model.DungeonStats) error
}

type dungeonStatsDao struct {
	db    *gorm.DB
	cache cache.DungeonStatsCache // if nil, the cache is not used.
	sfg   *singleflight.Group     // if cache is nil, the sfg is not used.
}

// NewDungeonStatsDao creating the dao interface
func NewDungeonStatsDao(db *gorm.DB, xCache cache.DungeonStatsCache) DungeonStatsDao {
	if xCache == nil {
		return &dungeonStatsDao{db: db}
	}
	return &dungeonStatsDao{
		db:    db,
		cache: xCache,
		sfg:   new(singleflight.Group),
	}
}

func (d *dungeonStatsDao) deleteCache(ctx context.Context, id uint64) error {
	if d.cache != nil {
		return d.cache.Del(ctx, id)
	}
	return nil
}

// Create a record, insert the record and the id value is written back to the table
func (d *dungeonStatsDao) Create(ctx context.Context, table *model.DungeonStats) error {
	return d.db.WithContext(ctx).Create(table).Error
}

// DeleteByID delete a record by id
func (d *dungeonStatsDao) DeleteByID(ctx context.Context, id uint64) error {
	err := d.db.WithContext(ctx).Where("id = ?", id).Delete(&model.DungeonStats{}).Error
	if err != nil {
		return err
	}

	// delete cache
	_ = d.deleteCache(ctx, id)

	return nil
}

// UpdateByID update a record by id
func (d *dungeonStatsDao) UpdateByID(ctx context.Context, table *model.DungeonStats) error {
	err := d.updateDataByID(ctx, d.db, table)

	// delete cache
	_ = d.deleteCache(ctx, table.ID)

	return err
}

func (d *dungeonStatsDao) updateDataByID(ctx context.Context, db *gorm.DB, table *model.DungeonStats) error {
	if table.ID < 1 {
		return errors.New("id cannot be 0")
	}

	update := map[string]interface{}{}

	if table.GuildID != 0 {
		update["guild_id"] = table.GuildID
	}
	if table.DungeonName != "" {
		update["dungeon_name"] = table.DungeonName
	}
	update["total_count"] = table.TotalCount
	update["min_salary"] = table.MinSalary
	update["max_salary"] = table.MaxSalary
	update["avg_salary"] = table.AvgSalary
	update["min_per_person_salary"] = table.MinPerPersonSalary
	update["max_per_person_salary"] = table.MaxPerPersonSalary
	update["avg_per_person_salary"] = table.AvgPerPersonSalary

	if table.MinSalaryTeamID != nil {
		update["min_salary_team_id"] = table.MinSalaryTeamID
	}
	if table.MaxSalaryTeamID != nil {
		update["max_salary_team_id"] = table.MaxSalaryTeamID
	}

	if table.CreateTime != nil && !table.CreateTime.IsZero() {
		update["create_time"] = table.CreateTime
	}
	if table.UpdateTime != nil && !table.UpdateTime.IsZero() {
		update["update_time"] = table.UpdateTime
	}

	return db.WithContext(ctx).Model(table).Updates(update).Error
}

// GetByID get a record by id
func (d *dungeonStatsDao) GetByID(ctx context.Context, id uint64) (*model.DungeonStats, error) {
	// no cache
	if d.cache == nil {
		record := &model.DungeonStats{}
		err := d.db.WithContext(ctx).Where("id = ?", id).First(record).Error
		return record, err
	}

	// get from cache
	record, err := d.cache.Get(ctx, id)
	if err == nil {
		return record, nil
	}

	// get from database
	if errors.Is(err, database.ErrCacheNotFound) {
		// for the same id, prevent high concurrent simultaneous access to database
		val, err, _ := d.sfg.Do(utils.Uint64ToStr(id), func() (interface{}, error) { //nolint
			table := &model.DungeonStats{}
			err = d.db.WithContext(ctx).Where("id = ?", id).First(table).Error
			if err != nil {
				if errors.Is(err, database.ErrRecordNotFound) {
					// set placeholder cache to prevent cache penetration, default expiration time 10 minutes
					if err = d.cache.SetPlaceholder(ctx, id); err != nil {
						logger.Warn("cache.SetPlaceholder error", logger.Err(err), logger.Any("id", id))
					}
					return nil, database.ErrRecordNotFound
				}
				return nil, err
			}
			// set cache
			if err = d.cache.Set(ctx, id, table, cache.DungeonStatsExpireTime); err != nil {
				logger.Warn("cache.Set error", logger.Err(err), logger.Any("id", id))
			}
			return table, nil
		})
		if err != nil {
			return nil, err
		}
		table, ok := val.(*model.DungeonStats)
		if !ok {
			return nil, database.ErrRecordNotFound
		}
		return table, nil
	}

	if d.cache.IsPlaceholderErr(err) {
		return nil, database.ErrRecordNotFound
	}

	return nil, err
}

// GetByGuildAndDungeon get a record by guild_id and dungeon_name
func (d *dungeonStatsDao) GetByGuildAndDungeon(ctx context.Context, guildID int, dungeonName string) (*model.DungeonStats, error) {
	record := &model.DungeonStats{}
	err := d.db.WithContext(ctx).Where("guild_id = ? AND dungeon_name = ?", guildID, dungeonName).First(record).Error
	if err != nil {
		return nil, err
	}
	return record, nil
}

// GetByColumns get paging records by column information
func (d *dungeonStatsDao) GetByColumns(ctx context.Context, params *query.Params) ([]*model.DungeonStats, int64, error) {
	queryStr, args, err := params.ConvertToGormConditions()
	if err != nil {
		return nil, 0, errors.New("query params error: " + err.Error())
	}

	var total int64
	if params.Sort != "ignore count" { // determine if count is required
		err = d.db.WithContext(ctx).Model(&model.DungeonStats{}).Where(queryStr, args...).Count(&total).Error
		if err != nil {
			return nil, 0, err
		}
		if total == 0 {
			return nil, total, nil
		}
	}

	records := []*model.DungeonStats{}
	order, limit, offset := params.ConvertToPage()
	err = d.db.WithContext(ctx).Order(order).Limit(limit).Offset(offset).Where(queryStr, args...).Find(&records).Error
	if err != nil {
		return nil, 0, err
	}

	return records, total, err
}

// UpsertStats upsert (insert or update) dungeon statistics
func (d *dungeonStatsDao) UpsertStats(ctx context.Context, stats *model.DungeonStats) error {
	return d.UpsertStatsByTx(ctx, d.db, stats)
}

// CreateByTx create a record in the database using the provided transaction
func (d *dungeonStatsDao) CreateByTx(ctx context.Context, tx *gorm.DB, table *model.DungeonStats) (uint64, error) {
	err := tx.WithContext(ctx).Create(table).Error
	return table.ID, err
}

// DeleteByTx delete a record by id in the database using the provided transaction
func (d *dungeonStatsDao) DeleteByTx(ctx context.Context, tx *gorm.DB, id uint64) error {
	err := tx.WithContext(ctx).Where("id = ?", id).Delete(&model.DungeonStats{}).Error
	if err != nil {
		return err
	}

	// delete cache
	_ = d.deleteCache(ctx, id)

	return nil
}

// UpdateByTx update a record by id in the database using the provided transaction
func (d *dungeonStatsDao) UpdateByTx(ctx context.Context, tx *gorm.DB, table *model.DungeonStats) error {
	err := d.updateDataByID(ctx, tx, table)

	// delete cache
	_ = d.deleteCache(ctx, table.ID)

	return err
}

// UpsertStatsByTx upsert dungeon statistics in a transaction
func (d *dungeonStatsDao) UpsertStatsByTx(ctx context.Context, tx *gorm.DB, stats *model.DungeonStats) error {
	// PostgreSQL UPSERT using ON CONFLICT
	err := tx.WithContext(ctx).Exec(`
		INSERT INTO dungeon_stats (
			guild_id, dungeon_name, total_count, min_salary, max_salary, avg_salary,
			min_per_person_salary, max_per_person_salary, avg_per_person_salary,
			min_salary_team_id, max_salary_team_id, update_time
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
		ON CONFLICT (guild_id, dungeon_name)
		DO UPDATE SET
			total_count = EXCLUDED.total_count,
			min_salary = EXCLUDED.min_salary,
			max_salary = EXCLUDED.max_salary,
			avg_salary = EXCLUDED.avg_salary,
			min_per_person_salary = EXCLUDED.min_per_person_salary,
			max_per_person_salary = EXCLUDED.max_per_person_salary,
			avg_per_person_salary = EXCLUDED.avg_per_person_salary,
			min_salary_team_id = EXCLUDED.min_salary_team_id,
			max_salary_team_id = EXCLUDED.max_salary_team_id,
			update_time = NOW()
	`, stats.GuildID, stats.DungeonName, stats.TotalCount, stats.MinSalary, stats.MaxSalary, stats.AvgSalary,
		stats.MinPerPersonSalary, stats.MaxPerPersonSalary, stats.AvgPerPersonSalary,
		stats.MinSalaryTeamID, stats.MaxSalaryTeamID).Error

	if err != nil {
		return err
	}

	// delete cache if exists
	if stats.ID > 0 {
		_ = d.deleteCache(ctx, stats.ID)
	}

	return nil
}
