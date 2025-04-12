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
	usersCachePrefixKey = "users:"
	// UsersExpireTime expire time
	UsersExpireTime = 5 * time.Minute
)

var _ UsersCache = (*usersCache)(nil)

// UsersCache cache interface
type UsersCache interface {
	Set(ctx context.Context, id uint64, data *model.Users, duration time.Duration) error
	Get(ctx context.Context, id uint64) (*model.Users, error)
	MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Users, error)
	MultiSet(ctx context.Context, data []*model.Users, duration time.Duration) error
	Del(ctx context.Context, id uint64) error
	SetPlaceholder(ctx context.Context, id uint64) error
	IsPlaceholderErr(err error) bool
}

// usersCache define a cache struct
type usersCache struct {
	cache cache.Cache
}

// NewUsersCache new a cache
func NewUsersCache(cacheType *database.CacheType) UsersCache {
	jsonEncoding := encoding.JSONEncoding{}
	cachePrefix := ""

	cType := strings.ToLower(cacheType.CType)
	switch cType {
	case "redis":
		c := cache.NewRedisCache(cacheType.Rdb, cachePrefix, jsonEncoding, func() interface{} {
			return &model.Users{}
		})
		return &usersCache{cache: c}
	case "memory":
		c := cache.NewMemoryCache(cachePrefix, jsonEncoding, func() interface{} {
			return &model.Users{}
		})
		return &usersCache{cache: c}
	}

	return nil // no cache
}

// GetUsersCacheKey cache key
func (c *usersCache) GetUsersCacheKey(id uint64) string {
	return usersCachePrefixKey + utils.Uint64ToStr(id)
}

// Set write to cache
func (c *usersCache) Set(ctx context.Context, id uint64, data *model.Users, duration time.Duration) error {
	if data == nil || id == 0 {
		return nil
	}
	cacheKey := c.GetUsersCacheKey(id)
	err := c.cache.Set(ctx, cacheKey, data, duration)
	if err != nil {
		return err
	}
	return nil
}

// Get cache value
func (c *usersCache) Get(ctx context.Context, id uint64) (*model.Users, error) {
	var data *model.Users
	cacheKey := c.GetUsersCacheKey(id)
	err := c.cache.Get(ctx, cacheKey, &data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// MultiSet multiple set cache
func (c *usersCache) MultiSet(ctx context.Context, data []*model.Users, duration time.Duration) error {
	valMap := make(map[string]interface{})
	for _, v := range data {
		cacheKey := c.GetUsersCacheKey(v.ID)
		valMap[cacheKey] = v
	}

	err := c.cache.MultiSet(ctx, valMap, duration)
	if err != nil {
		return err
	}

	return nil
}

// MultiGet multiple get cache, return key in map is id value
func (c *usersCache) MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Users, error) {
	var keys []string
	for _, v := range ids {
		cacheKey := c.GetUsersCacheKey(v)
		keys = append(keys, cacheKey)
	}

	itemMap := make(map[string]*model.Users)
	err := c.cache.MultiGet(ctx, keys, itemMap)
	if err != nil {
		return nil, err
	}

	retMap := make(map[uint64]*model.Users)
	for _, id := range ids {
		val, ok := itemMap[c.GetUsersCacheKey(id)]
		if ok {
			retMap[id] = val
		}
	}

	return retMap, nil
}

// Del delete cache
func (c *usersCache) Del(ctx context.Context, id uint64) error {
	cacheKey := c.GetUsersCacheKey(id)
	err := c.cache.Del(ctx, cacheKey)
	if err != nil {
		return err
	}
	return nil
}

// SetPlaceholder set placeholder value to cache
func (c *usersCache) SetPlaceholder(ctx context.Context, id uint64) error {
	cacheKey := c.GetUsersCacheKey(id)
	return c.cache.SetCacheWithNotFound(ctx, cacheKey)
}

// IsPlaceholderErr check if cache is placeholder error
func (c *usersCache) IsPlaceholderErr(err error) bool {
	return errors.Is(err, cache.ErrPlaceholder)
}
