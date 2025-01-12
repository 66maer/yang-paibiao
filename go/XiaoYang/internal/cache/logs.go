package cache

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/zhufuyi/sponge/pkg/cache"
	"github.com/zhufuyi/sponge/pkg/encoding"
	"github.com/zhufuyi/sponge/pkg/utils"

	"XiaoYang/internal/database"
	"XiaoYang/internal/model"
)

const (
	// cache prefix key, must end with a colon
	logsCachePrefixKey = "logs:"
	// LogsExpireTime expire time
	LogsExpireTime = 5 * time.Minute
)

var _ LogsCache = (*logsCache)(nil)

// LogsCache cache interface
type LogsCache interface {
	Set(ctx context.Context, id uint64, data *model.Logs, duration time.Duration) error
	Get(ctx context.Context, id uint64) (*model.Logs, error)
	MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Logs, error)
	MultiSet(ctx context.Context, data []*model.Logs, duration time.Duration) error
	Del(ctx context.Context, id uint64) error
	SetPlaceholder(ctx context.Context, id uint64) error
	IsPlaceholderErr(err error) bool
}

// logsCache define a cache struct
type logsCache struct {
	cache cache.Cache
}

// NewLogsCache new a cache
func NewLogsCache(cacheType *database.CacheType) LogsCache {
	jsonEncoding := encoding.JSONEncoding{}
	cachePrefix := ""

	cType := strings.ToLower(cacheType.CType)
	switch cType {
	case "redis":
		c := cache.NewRedisCache(cacheType.Rdb, cachePrefix, jsonEncoding, func() interface{} {
			return &model.Logs{}
		})
		return &logsCache{cache: c}
	case "memory":
		c := cache.NewMemoryCache(cachePrefix, jsonEncoding, func() interface{} {
			return &model.Logs{}
		})
		return &logsCache{cache: c}
	}

	return nil // no cache
}

// GetLogsCacheKey cache key
func (c *logsCache) GetLogsCacheKey(id uint64) string {
	return logsCachePrefixKey + utils.Uint64ToStr(id)
}

// Set write to cache
func (c *logsCache) Set(ctx context.Context, id uint64, data *model.Logs, duration time.Duration) error {
	if data == nil || id == 0 {
		return nil
	}
	cacheKey := c.GetLogsCacheKey(id)
	err := c.cache.Set(ctx, cacheKey, data, duration)
	if err != nil {
		return err
	}
	return nil
}

// Get cache value
func (c *logsCache) Get(ctx context.Context, id uint64) (*model.Logs, error) {
	var data *model.Logs
	cacheKey := c.GetLogsCacheKey(id)
	err := c.cache.Get(ctx, cacheKey, &data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// MultiSet multiple set cache
func (c *logsCache) MultiSet(ctx context.Context, data []*model.Logs, duration time.Duration) error {
	valMap := make(map[string]interface{})
	for _, v := range data {
		cacheKey := c.GetLogsCacheKey(v.ID)
		valMap[cacheKey] = v
	}

	err := c.cache.MultiSet(ctx, valMap, duration)
	if err != nil {
		return err
	}

	return nil
}

// MultiGet multiple get cache, return key in map is id value
func (c *logsCache) MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Logs, error) {
	var keys []string
	for _, v := range ids {
		cacheKey := c.GetLogsCacheKey(v)
		keys = append(keys, cacheKey)
	}

	itemMap := make(map[string]*model.Logs)
	err := c.cache.MultiGet(ctx, keys, itemMap)
	if err != nil {
		return nil, err
	}

	retMap := make(map[uint64]*model.Logs)
	for _, id := range ids {
		val, ok := itemMap[c.GetLogsCacheKey(id)]
		if ok {
			retMap[id] = val
		}
	}

	return retMap, nil
}

// Del delete cache
func (c *logsCache) Del(ctx context.Context, id uint64) error {
	cacheKey := c.GetLogsCacheKey(id)
	err := c.cache.Del(ctx, cacheKey)
	if err != nil {
		return err
	}
	return nil
}

// SetPlaceholder set placeholder value to cache
func (c *logsCache) SetPlaceholder(ctx context.Context, id uint64) error {
	cacheKey := c.GetLogsCacheKey(id)
	return c.cache.SetCacheWithNotFound(ctx, cacheKey)
}

// IsPlaceholderErr check if cache is placeholder error
func (c *logsCache) IsPlaceholderErr(err error) bool {
	return errors.Is(err, cache.ErrPlaceholder)
}
