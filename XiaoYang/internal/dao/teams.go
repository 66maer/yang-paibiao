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

var _ TeamsDao = (*teamsDao)(nil)

// TeamsDao defining the dao interface
type TeamsDao interface {
	Create(ctx context.Context, table *model.Teams) error
	DeleteByID(ctx context.Context, id uint64) error
	UpdateByID(ctx context.Context, table *model.Teams) error
	GetByID(ctx context.Context, id uint64) (*model.Teams, error)
	GetByColumns(ctx context.Context, params *query.Params) ([]*model.Teams, int64, error)

	CreateByTx(ctx context.Context, tx *gorm.DB, table *model.Teams) (uint64, error)
	DeleteByTx(ctx context.Context, tx *gorm.DB, id uint64) error
	UpdateByTx(ctx context.Context, tx *gorm.DB, table *model.Teams) error
}

type teamsDao struct {
	db    *gorm.DB
	cache cache.TeamsCache    // if nil, the cache is not used.
	sfg   *singleflight.Group // if cache is nil, the sfg is not used.
}

// NewTeamsDao creating the dao interface
func NewTeamsDao(db *gorm.DB, xCache cache.TeamsCache) TeamsDao {
	if xCache == nil {
		return &teamsDao{db: db}
	}
	return &teamsDao{
		db:    db,
		cache: xCache,
		sfg:   new(singleflight.Group),
	}
}

func (d *teamsDao) deleteCache(ctx context.Context, id uint64) error {
	if d.cache != nil {
		return d.cache.Del(ctx, id)
	}
	return nil
}

// Create a record, insert the record and the id value is written back to the table
func (d *teamsDao) Create(ctx context.Context, table *model.Teams) error {
	return d.db.WithContext(ctx).Create(table).Error
}

// DeleteByID delete a record by id
func (d *teamsDao) DeleteByID(ctx context.Context, id uint64) error {
	err := d.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Teams{}).Error
	if err != nil {
		return err
	}

	// delete cache
	_ = d.deleteCache(ctx, id)

	return nil
}

// UpdateByID update a record by id
func (d *teamsDao) UpdateByID(ctx context.Context, table *model.Teams) error {
	err := d.updateDataByID(ctx, d.db, table)

	// delete cache
	_ = d.deleteCache(ctx, table.ID)

	return err
}

func (d *teamsDao) updateDataByID(ctx context.Context, db *gorm.DB, table *model.Teams) error {
	if table.ID < 1 {
		return errors.New("id cannot be 0")
	}

	update := map[string]interface{}{}

	if table.GuildID != 0 {
		update["guild_id"] = table.GuildID
	}
	if table.CreaterID != 0 {
		update["creater_id"] = table.CreaterID
	}
	if table.Title != "" {
		update["title"] = table.Title
	}
	if table.TeamTime != nil && !table.TeamTime.IsZero() {
		update["team_time"] = table.TeamTime
	}
	if table.Dungeons != "" {
		update["dungeons"] = table.Dungeons
	}

	update["book_xuanjing"] = table.BookXuanjing

	update["book_yuntie"] = table.BookYuntie

	update["is_visible"] = table.IsVisible

	update["is_lock"] = table.IsLock

	if table.Rule != nil && table.Rule.String() != "" {
		update["rule"] = table.Rule
	}
	if table.Notice != "" {
		update["notice"] = table.Notice
	}
	if table.CreateTime != nil && !table.CreateTime.IsZero() {
		update["create_time"] = table.CreateTime
	}
	if table.UpdateTime != nil && !table.UpdateTime.IsZero() {
		update["update_time"] = table.UpdateTime
	}
	if table.CloseTime != nil && !table.CloseTime.IsZero() {
		update["close_time"] = table.CloseTime
	}
	if table.CloseID != 0 {
		update["close_id"] = table.CloseID
	}
	if table.Summary != nil && table.Summary.String() != "" {
		update["summary"] = table.Summary
	}

	return db.WithContext(ctx).Model(table).Updates(update).Error
}

// GetByID get a record by id
func (d *teamsDao) GetByID(ctx context.Context, id uint64) (*model.Teams, error) {
	// no cache
	if d.cache == nil {
		record := &model.Teams{}
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
			table := &model.Teams{}
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
			if err = d.cache.Set(ctx, id, table, cache.TeamsExpireTime); err != nil {
				logger.Warn("cache.Set error", logger.Err(err), logger.Any("id", id))
			}
			return table, nil
		})
		if err != nil {
			return nil, err
		}
		table, ok := val.(*model.Teams)
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

// GetByColumns get paging records by column information,
// Note: query performance degrades when table rows are very large because of the use of offset.
//
// params includes paging parameters and query parameters
// paging parameters (required):
//
//	page: page number, starting from 0
//	limit: lines per page
//	sort: sort fields, default is id backwards, you can add - sign before the field to indicate reverse order, no - sign to indicate ascending order, multiple fields separated by comma
//
// query parameters (not required):
//
//	name: column name
//	exp: expressions, which default is "=",  support =, !=, >, >=, <, <=, like, in, notin, isnull, isnotnull
//	value: column value, if exp=in, multiple values are separated by commas
//	logic: logical type, default value is "and", support &, and, ||, or
//
// example: search for a male over 20 years of age
//
//	params = &query.Params{
//	    Page: 0,
//	    Limit: 20,
//	    Columns: []query.Column{
//		{
//			Name:    "age",
//			Exp: ">",
//			Value:   20,
//		},
//		{
//			Name:  "gender",
//			Value: "male",
//		},
//	}
func (d *teamsDao) GetByColumns(ctx context.Context, params *query.Params) ([]*model.Teams, int64, error) {
	queryStr, args, err := params.ConvertToGormConditions()
	if err != nil {
		return nil, 0, errors.New("query params error: " + err.Error())
	}

	var total int64
	if params.Sort != "ignore count" { // determine if count is required
		err = d.db.WithContext(ctx).Model(&model.Teams{}).Where(queryStr, args...).Count(&total).Error
		if err != nil {
			return nil, 0, err
		}
		if total == 0 {
			return nil, total, nil
		}
	}

	records := []*model.Teams{}
	order, limit, offset := params.ConvertToPage()
	err = d.db.WithContext(ctx).Order(order).Limit(limit).Offset(offset).Where(queryStr, args...).Find(&records).Error
	if err != nil {
		return nil, 0, err
	}

	return records, total, err
}

// CreateByTx create a record in the database using the provided transaction
func (d *teamsDao) CreateByTx(ctx context.Context, tx *gorm.DB, table *model.Teams) (uint64, error) {
	err := tx.WithContext(ctx).Create(table).Error
	return table.ID, err
}

// DeleteByTx delete a record by id in the database using the provided transaction
func (d *teamsDao) DeleteByTx(ctx context.Context, tx *gorm.DB, id uint64) error {
	err := tx.WithContext(ctx).Where("id = ?", id).Delete(&model.Teams{}).Error
	if err != nil {
		return err
	}

	// delete cache
	_ = d.deleteCache(ctx, id)

	return nil
}

// UpdateByTx update a record by id in the database using the provided transaction
func (d *teamsDao) UpdateByTx(ctx context.Context, tx *gorm.DB, table *model.Teams) error {
	err := d.updateDataByID(ctx, tx, table)

	// delete cache
	_ = d.deleteCache(ctx, table.ID)

	return err
}
