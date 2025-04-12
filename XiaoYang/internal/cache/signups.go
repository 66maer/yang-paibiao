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
	signupsCachePrefixKey = "signups:"
	// SignupsExpireTime expire time
	SignupsExpireTime = 5 * time.Minute
)

var _ SignupsCache = (*signupsCache)(nil)

// SignupsCache cache interface
type SignupsCache interface {
	Set(ctx context.Context, id uint64, data *model.Signups, duration time.Duration) error
	Get(ctx context.Context, id uint64) (*model.Signups, error)
	MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Signups, error)
	MultiSet(ctx context.Context, data []*model.Signups, duration time.Duration) error
	Del(ctx context.Context, id uint64) error
	SetPlaceholder(ctx context.Context, id uint64) error
	IsPlaceholderErr(err error) bool
}

// signupsCache define a cache struct
type signupsCache struct {
	cache cache.Cache
}

// NewSignupsCache new a cache
func NewSignupsCache(cacheType *database.CacheType) SignupsCache {
	jsonEncoding := encoding.JSONEncoding{}
	cachePrefix := ""

	cType := strings.ToLower(cacheType.CType)
	switch cType {
	case "redis":
		c := cache.NewRedisCache(cacheType.Rdb, cachePrefix, jsonEncoding, func() interface{} {
			return &model.Signups{}
		})
		return &signupsCache{cache: c}
	case "memory":
		c := cache.NewMemoryCache(cachePrefix, jsonEncoding, func() interface{} {
			return &model.Signups{}
		})
		return &signupsCache{cache: c}
	}

	return nil // no cache
}

// GetSignupsCacheKey cache key
func (c *signupsCache) GetSignupsCacheKey(id uint64) string {
	return signupsCachePrefixKey + utils.Uint64ToStr(id)
}

// Set write to cache
func (c *signupsCache) Set(ctx context.Context, id uint64, data *model.Signups, duration time.Duration) error {
	if data == nil || id == 0 {
		return nil
	}
	cacheKey := c.GetSignupsCacheKey(id)
	err := c.cache.Set(ctx, cacheKey, data, duration)
	if err != nil {
		return err
	}
	return nil
}

// Get cache value
func (c *signupsCache) Get(ctx context.Context, id uint64) (*model.Signups, error) {
	var data *model.Signups
	cacheKey := c.GetSignupsCacheKey(id)
	err := c.cache.Get(ctx, cacheKey, &data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// MultiSet multiple set cache
func (c *signupsCache) MultiSet(ctx context.Context, data []*model.Signups, duration time.Duration) error {
	valMap := make(map[string]interface{})
	for _, v := range data {
		cacheKey := c.GetSignupsCacheKey(v.ID)
		valMap[cacheKey] = v
	}

	err := c.cache.MultiSet(ctx, valMap, duration)
	if err != nil {
		return err
	}

	return nil
}

// MultiGet multiple get cache, return key in map is id value
func (c *signupsCache) MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Signups, error) {
	var keys []string
	for _, v := range ids {
		cacheKey := c.GetSignupsCacheKey(v)
		keys = append(keys, cacheKey)
	}

	itemMap := make(map[string]*model.Signups)
	err := c.cache.MultiGet(ctx, keys, itemMap)
	if err != nil {
		return nil, err
	}

	retMap := make(map[uint64]*model.Signups)
	for _, id := range ids {
		val, ok := itemMap[c.GetSignupsCacheKey(id)]
		if ok {
			retMap[id] = val
		}
	}

	return retMap, nil
}

// Del delete cache
func (c *signupsCache) Del(ctx context.Context, id uint64) error {
	cacheKey := c.GetSignupsCacheKey(id)
	err := c.cache.Del(ctx, cacheKey)
	if err != nil {
		return err
	}
	return nil
}

// SetPlaceholder set placeholder value to cache
func (c *signupsCache) SetPlaceholder(ctx context.Context, id uint64) error {
	cacheKey := c.GetSignupsCacheKey(id)
	return c.cache.SetCacheWithNotFound(ctx, cacheKey)
}

// IsPlaceholderErr check if cache is placeholder error
func (c *signupsCache) IsPlaceholderErr(err error) bool {
	return errors.Is(err, cache.ErrPlaceholder)
}
