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
	teamTemplatesCachePrefixKey = "teamTemplates:"
	// TeamTemplatesExpireTime expire time
	TeamTemplatesExpireTime = 5 * time.Minute
)

var _ TeamTemplatesCache = (*teamTemplatesCache)(nil)

// TeamTemplatesCache cache interface
type TeamTemplatesCache interface {
	Set(ctx context.Context, id uint64, data *model.TeamTemplates, duration time.Duration) error
	Get(ctx context.Context, id uint64) (*model.TeamTemplates, error)
	MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.TeamTemplates, error)
	MultiSet(ctx context.Context, data []*model.TeamTemplates, duration time.Duration) error
	Del(ctx context.Context, id uint64) error
	SetPlaceholder(ctx context.Context, id uint64) error
	IsPlaceholderErr(err error) bool
}

// teamTemplatesCache define a cache struct
type teamTemplatesCache struct {
	cache cache.Cache
}

// NewTeamTemplatesCache new a cache
func NewTeamTemplatesCache(cacheType *database.CacheType) TeamTemplatesCache {
	jsonEncoding := encoding.JSONEncoding{}
	cachePrefix := ""

	cType := strings.ToLower(cacheType.CType)
	switch cType {
	case "redis":
		c := cache.NewRedisCache(cacheType.Rdb, cachePrefix, jsonEncoding, func() interface{} {
			return &model.TeamTemplates{}
		})
		return &teamTemplatesCache{cache: c}
	case "memory":
		c := cache.NewMemoryCache(cachePrefix, jsonEncoding, func() interface{} {
			return &model.TeamTemplates{}
		})
		return &teamTemplatesCache{cache: c}
	}

	return nil // no cache
}

// GetTeamTemplatesCacheKey cache key
func (c *teamTemplatesCache) GetTeamTemplatesCacheKey(id uint64) string {
	return teamTemplatesCachePrefixKey + utils.Uint64ToStr(id)
}

// Set write to cache
func (c *teamTemplatesCache) Set(ctx context.Context, id uint64, data *model.TeamTemplates, duration time.Duration) error {
	if data == nil || id == 0 {
		return nil
	}
	cacheKey := c.GetTeamTemplatesCacheKey(id)
	err := c.cache.Set(ctx, cacheKey, data, duration)
	if err != nil {
		return err
	}
	return nil
}

// Get cache value
func (c *teamTemplatesCache) Get(ctx context.Context, id uint64) (*model.TeamTemplates, error) {
	var data *model.TeamTemplates
	cacheKey := c.GetTeamTemplatesCacheKey(id)
	err := c.cache.Get(ctx, cacheKey, &data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// MultiSet multiple set cache
func (c *teamTemplatesCache) MultiSet(ctx context.Context, data []*model.TeamTemplates, duration time.Duration) error {
	valMap := make(map[string]interface{})
	for _, v := range data {
		cacheKey := c.GetTeamTemplatesCacheKey(v.ID)
		valMap[cacheKey] = v
	}

	err := c.cache.MultiSet(ctx, valMap, duration)
	if err != nil {
		return err
	}

	return nil
}

// MultiGet multiple get cache, return key in map is id value
func (c *teamTemplatesCache) MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.TeamTemplates, error) {
	var keys []string
	for _, v := range ids {
		cacheKey := c.GetTeamTemplatesCacheKey(v)
		keys = append(keys, cacheKey)
	}

	itemMap := make(map[string]*model.TeamTemplates)
	err := c.cache.MultiGet(ctx, keys, itemMap)
	if err != nil {
		return nil, err
	}

	retMap := make(map[uint64]*model.TeamTemplates)
	for _, id := range ids {
		val, ok := itemMap[c.GetTeamTemplatesCacheKey(id)]
		if ok {
			retMap[id] = val
		}
	}

	return retMap, nil
}

// Del delete cache
func (c *teamTemplatesCache) Del(ctx context.Context, id uint64) error {
	cacheKey := c.GetTeamTemplatesCacheKey(id)
	err := c.cache.Del(ctx, cacheKey)
	if err != nil {
		return err
	}
	return nil
}

// SetPlaceholder set placeholder value to cache
func (c *teamTemplatesCache) SetPlaceholder(ctx context.Context, id uint64) error {
	cacheKey := c.GetTeamTemplatesCacheKey(id)
	return c.cache.SetCacheWithNotFound(ctx, cacheKey)
}

// IsPlaceholderErr check if cache is placeholder error
func (c *teamTemplatesCache) IsPlaceholderErr(err error) bool {
	return errors.Is(err, cache.ErrPlaceholder)
}
