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
	teamsCachePrefixKey = "teams:"
	// TeamsExpireTime expire time
	TeamsExpireTime = 5 * time.Minute
)

var _ TeamsCache = (*teamsCache)(nil)

// TeamsCache cache interface
type TeamsCache interface {
	Set(ctx context.Context, id uint64, data *model.Teams, duration time.Duration) error
	Get(ctx context.Context, id uint64) (*model.Teams, error)
	MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Teams, error)
	MultiSet(ctx context.Context, data []*model.Teams, duration time.Duration) error
	Del(ctx context.Context, id uint64) error
	SetPlaceholder(ctx context.Context, id uint64) error
	IsPlaceholderErr(err error) bool
}

// teamsCache define a cache struct
type teamsCache struct {
	cache cache.Cache
}

// NewTeamsCache new a cache
func NewTeamsCache(cacheType *database.CacheType) TeamsCache {
	jsonEncoding := encoding.JSONEncoding{}
	cachePrefix := ""

	cType := strings.ToLower(cacheType.CType)
	switch cType {
	case "redis":
		c := cache.NewRedisCache(cacheType.Rdb, cachePrefix, jsonEncoding, func() interface{} {
			return &model.Teams{}
		})
		return &teamsCache{cache: c}
	case "memory":
		c := cache.NewMemoryCache(cachePrefix, jsonEncoding, func() interface{} {
			return &model.Teams{}
		})
		return &teamsCache{cache: c}
	}

	return nil // no cache
}

// GetTeamsCacheKey cache key
func (c *teamsCache) GetTeamsCacheKey(id uint64) string {
	return teamsCachePrefixKey + utils.Uint64ToStr(id)
}

// Set write to cache
func (c *teamsCache) Set(ctx context.Context, id uint64, data *model.Teams, duration time.Duration) error {
	if data == nil || id == 0 {
		return nil
	}
	cacheKey := c.GetTeamsCacheKey(id)
	err := c.cache.Set(ctx, cacheKey, data, duration)
	if err != nil {
		return err
	}
	return nil
}

// Get cache value
func (c *teamsCache) Get(ctx context.Context, id uint64) (*model.Teams, error) {
	var data *model.Teams
	cacheKey := c.GetTeamsCacheKey(id)
	err := c.cache.Get(ctx, cacheKey, &data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// MultiSet multiple set cache
func (c *teamsCache) MultiSet(ctx context.Context, data []*model.Teams, duration time.Duration) error {
	valMap := make(map[string]interface{})
	for _, v := range data {
		cacheKey := c.GetTeamsCacheKey(v.ID)
		valMap[cacheKey] = v
	}

	err := c.cache.MultiSet(ctx, valMap, duration)
	if err != nil {
		return err
	}

	return nil
}

// MultiGet multiple get cache, return key in map is id value
func (c *teamsCache) MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Teams, error) {
	var keys []string
	for _, v := range ids {
		cacheKey := c.GetTeamsCacheKey(v)
		keys = append(keys, cacheKey)
	}

	itemMap := make(map[string]*model.Teams)
	err := c.cache.MultiGet(ctx, keys, itemMap)
	if err != nil {
		return nil, err
	}

	retMap := make(map[uint64]*model.Teams)
	for _, id := range ids {
		val, ok := itemMap[c.GetTeamsCacheKey(id)]
		if ok {
			retMap[id] = val
		}
	}

	return retMap, nil
}

// Del delete cache
func (c *teamsCache) Del(ctx context.Context, id uint64) error {
	cacheKey := c.GetTeamsCacheKey(id)
	err := c.cache.Del(ctx, cacheKey)
	if err != nil {
		return err
	}
	return nil
}

// SetPlaceholder set placeholder value to cache
func (c *teamsCache) SetPlaceholder(ctx context.Context, id uint64) error {
	cacheKey := c.GetTeamsCacheKey(id)
	return c.cache.SetCacheWithNotFound(ctx, cacheKey)
}

// IsPlaceholderErr check if cache is placeholder error
func (c *teamsCache) IsPlaceholderErr(err error) bool {
	return errors.Is(err, cache.ErrPlaceholder)
}
