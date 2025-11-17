package cache

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/go-dev-frame/sponge/pkg/cache"
	"github.com/go-dev-frame/sponge/pkg/encoding"
	"github.com/go-dev-frame/sponge/pkg/utils"

	"XiaoYang/internal/database"
	"XiaoYang/internal/model"
)

const (
	// cache prefix key, must end with a colon
	dungeonStatsCachePrefixKey = "dungeonStats:"
	// DungeonStatsExpireTime expire time
	DungeonStatsExpireTime = 5 * time.Minute
)

var _ DungeonStatsCache = (*dungeonStatsCache)(nil)

// DungeonStatsCache cache interface
type DungeonStatsCache interface {
	Set(ctx context.Context, id uint64, data *model.DungeonStats, duration time.Duration) error
	Get(ctx context.Context, id uint64) (*model.DungeonStats, error)
	MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.DungeonStats, error)
	MultiSet(ctx context.Context, data []*model.DungeonStats, duration time.Duration) error
	Del(ctx context.Context, id uint64) error
	SetPlaceholder(ctx context.Context, id uint64) error
	IsPlaceholderErr(err error) bool
}

// dungeonStatsCache define a cache struct
type dungeonStatsCache struct {
	cache cache.Cache
}

// NewDungeonStatsCache new a cache
func NewDungeonStatsCache(cacheType *database.CacheType) DungeonStatsCache {
	jsonEncoding := encoding.JSONEncoding{}
	cachePrefix := ""

	cType := strings.ToLower(cacheType.CType)
	switch cType {
	case "redis":
		c := cache.NewRedisCache(cacheType.Rdb, cachePrefix, jsonEncoding, func() interface{} {
			return &model.DungeonStats{}
		})
		return &dungeonStatsCache{cache: c}
	case "memory":
		c := cache.NewMemoryCache(cachePrefix, jsonEncoding, func() interface{} {
			return &model.DungeonStats{}
		})
		return &dungeonStatsCache{cache: c}
	}

	return nil // no cache
}

// GetDungeonStatsCacheKey cache key
func (c *dungeonStatsCache) GetDungeonStatsCacheKey(id uint64) string {
	return dungeonStatsCachePrefixKey + utils.Uint64ToStr(id)
}

// Set write to cache
func (c *dungeonStatsCache) Set(ctx context.Context, id uint64, data *model.DungeonStats, duration time.Duration) error {
	if data == nil || id == 0 {
		return nil
	}
	cacheKey := c.GetDungeonStatsCacheKey(id)
	err := c.cache.Set(ctx, cacheKey, data, duration)
	if err != nil {
		return err
	}
	return nil
}

// Get cache value
func (c *dungeonStatsCache) Get(ctx context.Context, id uint64) (*model.DungeonStats, error) {
	var data *model.DungeonStats
	cacheKey := c.GetDungeonStatsCacheKey(id)
	err := c.cache.Get(ctx, cacheKey, &data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// MultiSet multiple set cache
func (c *dungeonStatsCache) MultiSet(ctx context.Context, data []*model.DungeonStats, duration time.Duration) error {
	valMap := make(map[string]interface{})
	for _, v := range data {
		cacheKey := c.GetDungeonStatsCacheKey(v.ID)
		valMap[cacheKey] = v
	}

	err := c.cache.MultiSet(ctx, valMap, duration)
	if err != nil {
		return err
	}

	return nil
}

// MultiGet multiple get cache
func (c *dungeonStatsCache) MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.DungeonStats, error) {
	var keys []string
	for _, v := range ids {
		cacheKey := c.GetDungeonStatsCacheKey(v)
		keys = append(keys, cacheKey)
	}

	itemMap := make(map[string]*model.DungeonStats)
	err := c.cache.MultiGet(ctx, keys, itemMap)
	if err != nil {
		return nil, err
	}

	retMap := make(map[uint64]*model.DungeonStats)
	for _, id := range ids {
		val, ok := itemMap[c.GetDungeonStatsCacheKey(id)]
		if ok {
			retMap[id] = val
		}
	}

	return retMap, nil
}

// Del delete cache
func (c *dungeonStatsCache) Del(ctx context.Context, id uint64) error {
	cacheKey := c.GetDungeonStatsCacheKey(id)
	err := c.cache.Del(ctx, cacheKey)
	if err != nil {
		return err
	}
	return nil
}

// SetPlaceholder set placeholder
func (c *dungeonStatsCache) SetPlaceholder(ctx context.Context, id uint64) error {
	cacheKey := c.GetDungeonStatsCacheKey(id)
	err := c.cache.Set(ctx, cacheKey, &cache.Placeholder{}, time.Hour)
	if err != nil {
		return err
	}
	return nil
}

// IsPlaceholderErr check if error is placeholder error
func (c *dungeonStatsCache) IsPlaceholderErr(err error) bool {
	return errors.Is(err, cache.ErrPlaceholder)
}
