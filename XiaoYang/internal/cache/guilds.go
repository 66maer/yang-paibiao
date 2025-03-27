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
	guildsCachePrefixKey = "guilds:"
	// GuildsExpireTime expire time
	GuildsExpireTime = 5 * time.Minute
)

var _ GuildsCache = (*guildsCache)(nil)

// GuildsCache cache interface
type GuildsCache interface {
	Set(ctx context.Context, id uint64, data *model.Guilds, duration time.Duration) error
	Get(ctx context.Context, id uint64) (*model.Guilds, error)
	MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Guilds, error)
	MultiSet(ctx context.Context, data []*model.Guilds, duration time.Duration) error
	Del(ctx context.Context, id uint64) error
	SetPlaceholder(ctx context.Context, id uint64) error
	IsPlaceholderErr(err error) bool
}

// guildsCache define a cache struct
type guildsCache struct {
	cache cache.Cache
}

// NewGuildsCache new a cache
func NewGuildsCache(cacheType *database.CacheType) GuildsCache {
	jsonEncoding := encoding.JSONEncoding{}
	cachePrefix := ""

	cType := strings.ToLower(cacheType.CType)
	switch cType {
	case "redis":
		c := cache.NewRedisCache(cacheType.Rdb, cachePrefix, jsonEncoding, func() interface{} {
			return &model.Guilds{}
		})
		return &guildsCache{cache: c}
	case "memory":
		c := cache.NewMemoryCache(cachePrefix, jsonEncoding, func() interface{} {
			return &model.Guilds{}
		})
		return &guildsCache{cache: c}
	}

	return nil // no cache
}

// GetGuildsCacheKey cache key
func (c *guildsCache) GetGuildsCacheKey(id uint64) string {
	return guildsCachePrefixKey + utils.Uint64ToStr(id)
}

// Set write to cache
func (c *guildsCache) Set(ctx context.Context, id uint64, data *model.Guilds, duration time.Duration) error {
	if data == nil || id == 0 {
		return nil
	}
	cacheKey := c.GetGuildsCacheKey(id)
	err := c.cache.Set(ctx, cacheKey, data, duration)
	if err != nil {
		return err
	}
	return nil
}

// Get cache value
func (c *guildsCache) Get(ctx context.Context, id uint64) (*model.Guilds, error) {
	var data *model.Guilds
	cacheKey := c.GetGuildsCacheKey(id)
	err := c.cache.Get(ctx, cacheKey, &data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// MultiSet multiple set cache
func (c *guildsCache) MultiSet(ctx context.Context, data []*model.Guilds, duration time.Duration) error {
	valMap := make(map[string]interface{})
	for _, v := range data {
		cacheKey := c.GetGuildsCacheKey(v.ID)
		valMap[cacheKey] = v
	}

	err := c.cache.MultiSet(ctx, valMap, duration)
	if err != nil {
		return err
	}

	return nil
}

// MultiGet multiple get cache, return key in map is id value
func (c *guildsCache) MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Guilds, error) {
	var keys []string
	for _, v := range ids {
		cacheKey := c.GetGuildsCacheKey(v)
		keys = append(keys, cacheKey)
	}

	itemMap := make(map[string]*model.Guilds)
	err := c.cache.MultiGet(ctx, keys, itemMap)
	if err != nil {
		return nil, err
	}

	retMap := make(map[uint64]*model.Guilds)
	for _, id := range ids {
		val, ok := itemMap[c.GetGuildsCacheKey(id)]
		if ok {
			retMap[id] = val
		}
	}

	return retMap, nil
}

// Del delete cache
func (c *guildsCache) Del(ctx context.Context, id uint64) error {
	cacheKey := c.GetGuildsCacheKey(id)
	err := c.cache.Del(ctx, cacheKey)
	if err != nil {
		return err
	}
	return nil
}

// SetPlaceholder set placeholder value to cache
func (c *guildsCache) SetPlaceholder(ctx context.Context, id uint64) error {
	cacheKey := c.GetGuildsCacheKey(id)
	return c.cache.SetCacheWithNotFound(ctx, cacheKey)
}

// IsPlaceholderErr check if cache is placeholder error
func (c *guildsCache) IsPlaceholderErr(err error) bool {
	return errors.Is(err, cache.ErrPlaceholder)
}
