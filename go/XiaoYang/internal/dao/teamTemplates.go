package dao

import (
	"context"
	"errors"

	"golang.org/x/sync/singleflight"
	"gorm.io/gorm"

	"github.com/zhufuyi/sponge/pkg/logger"
	"github.com/zhufuyi/sponge/pkg/sgorm/query"
	"github.com/zhufuyi/sponge/pkg/utils"

	"XiaoYang/internal/cache"
	"XiaoYang/internal/database"
	"XiaoYang/internal/model"
)

var _ TeamTemplatesDao = (*teamTemplatesDao)(nil)

// TeamTemplatesDao defining the dao interface
type TeamTemplatesDao interface {
	Create(ctx context.Context, table *model.TeamTemplates) error
	DeleteByID(ctx context.Context, id uint64) error
	UpdateByID(ctx context.Context, table *model.TeamTemplates) error
	GetByID(ctx context.Context, id uint64) (*model.TeamTemplates, error)
	GetByColumns(ctx context.Context, params *query.Params) ([]*model.TeamTemplates, int64, error)

	CreateByTx(ctx context.Context, tx *gorm.DB, table *model.TeamTemplates) (uint64, error)
	DeleteByTx(ctx context.Context, tx *gorm.DB, id uint64) error
	UpdateByTx(ctx context.Context, tx *gorm.DB, table *model.TeamTemplates) error
}

type teamTemplatesDao struct {
	db    *gorm.DB
	cache cache.TeamTemplatesCache // if nil, the cache is not used.
	sfg   *singleflight.Group      // if cache is nil, the sfg is not used.
}

// NewTeamTemplatesDao creating the dao interface
func NewTeamTemplatesDao(db *gorm.DB, xCache cache.TeamTemplatesCache) TeamTemplatesDao {
	if xCache == nil {
		return &teamTemplatesDao{db: db}
	}
	return &teamTemplatesDao{
		db:    db,
		cache: xCache,
		sfg:   new(singleflight.Group),
	}
}

func (d *teamTemplatesDao) deleteCache(ctx context.Context, id uint64) error {
	if d.cache != nil {
		return d.cache.Del(ctx, id)
	}
	return nil
}

// Create a record, insert the record and the id value is written back to the table
func (d *teamTemplatesDao) Create(ctx context.Context, table *model.TeamTemplates) error {
	return d.db.WithContext(ctx).Create(table).Error
}

// DeleteByID delete a record by id
func (d *teamTemplatesDao) DeleteByID(ctx context.Context, id uint64) error {
	err := d.db.WithContext(ctx).Where("id = ?", id).Delete(&model.TeamTemplates{}).Error
	if err != nil {
		return err
	}

	// delete cache
	_ = d.deleteCache(ctx, id)

	return nil
}

// UpdateByID update a record by id
func (d *teamTemplatesDao) UpdateByID(ctx context.Context, table *model.TeamTemplates) error {
	err := d.updateDataByID(ctx, d.db, table)

	// delete cache
	_ = d.deleteCache(ctx, table.ID)

	return err
}

func (d *teamTemplatesDao) updateDataByID(ctx context.Context, db *gorm.DB, table *model.TeamTemplates) error {
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
	if table.Rule != nil {
		update["rule"] = table.Rule
	}
	if table.Notice != "" {
		update["notice"] = table.Notice
	}
	if table.CreateTime.IsZero() == false {
		update["create_time"] = table.CreateTime
	}
	if table.UpdateTime.IsZero() == false {
		update["update_time"] = table.UpdateTime
	}

	return db.WithContext(ctx).Model(table).Updates(update).Error
}

// GetByID get a record by id
func (d *teamTemplatesDao) GetByID(ctx context.Context, id uint64) (*model.TeamTemplates, error) {
	// no cache
	if d.cache == nil {
		record := &model.TeamTemplates{}
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
			table := &model.TeamTemplates{}
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
			if err = d.cache.Set(ctx, id, table, cache.TeamTemplatesExpireTime); err != nil {
				logger.Warn("cache.Set error", logger.Err(err), logger.Any("id", id))
			}
			return table, nil
		})
		if err != nil {
			return nil, err
		}
		table, ok := val.(*model.TeamTemplates)
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
//	exp: expressions, which default is "=",  support =, !=, >, >=, <, <=, like, in
//	value: column value, if exp=in, multiple values are separated by commas
//	logic: logical type, defaults to and when value is null, only &(and), ||(or)
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
func (d *teamTemplatesDao) GetByColumns(ctx context.Context, params *query.Params) ([]*model.TeamTemplates, int64, error) {
	queryStr, args, err := params.ConvertToGormConditions()
	if err != nil {
		return nil, 0, errors.New("query params error: " + err.Error())
	}

	var total int64
	if params.Sort != "ignore count" { // determine if count is required
		err = d.db.WithContext(ctx).Model(&model.TeamTemplates{}).Where(queryStr, args...).Count(&total).Error
		if err != nil {
			return nil, 0, err
		}
		if total == 0 {
			return nil, total, nil
		}
	}

	records := []*model.TeamTemplates{}
	order, limit, offset := params.ConvertToPage()
	err = d.db.WithContext(ctx).Order(order).Limit(limit).Offset(offset).Where(queryStr, args...).Find(&records).Error
	if err != nil {
		return nil, 0, err
	}

	return records, total, err
}

// CreateByTx create a record in the database using the provided transaction
func (d *teamTemplatesDao) CreateByTx(ctx context.Context, tx *gorm.DB, table *model.TeamTemplates) (uint64, error) {
	err := tx.WithContext(ctx).Create(table).Error
	return table.ID, err
}

// DeleteByTx delete a record by id in the database using the provided transaction
func (d *teamTemplatesDao) DeleteByTx(ctx context.Context, tx *gorm.DB, id uint64) error {
	err := tx.WithContext(ctx).Where("id = ?", id).Delete(&model.TeamTemplates{}).Error
	if err != nil {
		return err
	}

	// delete cache
	_ = d.deleteCache(ctx, id)

	return nil
}

// UpdateByTx update a record by id in the database using the provided transaction
func (d *teamTemplatesDao) UpdateByTx(ctx context.Context, tx *gorm.DB, table *model.TeamTemplates) error {
	err := d.updateDataByID(ctx, tx, table)

	// delete cache
	_ = d.deleteCache(ctx, table.ID)

	return err
}
