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
	charactersCachePrefixKey = "characters:"
	// CharactersExpireTime expire time
	CharactersExpireTime = 5 * time.Minute
)

var _ CharactersCache = (*charactersCache)(nil)

// CharactersCache cache interface
type CharactersCache interface {
	Set(ctx context.Context, id uint64, data *model.Characters, duration time.Duration) error
	Get(ctx context.Context, id uint64) (*model.Characters, error)
	MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Characters, error)
	MultiSet(ctx context.Context, data []*model.Characters, duration time.Duration) error
	Del(ctx context.Context, id uint64) error
	SetPlaceholder(ctx context.Context, id uint64) error
	IsPlaceholderErr(err error) bool
}

// charactersCache define a cache struct
type charactersCache struct {
	cache cache.Cache
}

// NewCharactersCache new a cache
func NewCharactersCache(cacheType *database.CacheType) CharactersCache {
	jsonEncoding := encoding.JSONEncoding{}
	cachePrefix := ""

	cType := strings.ToLower(cacheType.CType)
	switch cType {
	case "redis":
		c := cache.NewRedisCache(cacheType.Rdb, cachePrefix, jsonEncoding, func() interface{} {
			return &model.Characters{}
		})
		return &charactersCache{cache: c}
	case "memory":
		c := cache.NewMemoryCache(cachePrefix, jsonEncoding, func() interface{} {
			return &model.Characters{}
		})
		return &charactersCache{cache: c}
	}

	return nil // no cache
}

// GetCharactersCacheKey cache key
func (c *charactersCache) GetCharactersCacheKey(id uint64) string {
	return charactersCachePrefixKey + utils.Uint64ToStr(id)
}

// Set write to cache
func (c *charactersCache) Set(ctx context.Context, id uint64, data *model.Characters, duration time.Duration) error {
	if data == nil || id == 0 {
		return nil
	}
	cacheKey := c.GetCharactersCacheKey(id)
	err := c.cache.Set(ctx, cacheKey, data, duration)
	if err != nil {
		return err
	}
	return nil
}

// Get cache value
func (c *charactersCache) Get(ctx context.Context, id uint64) (*model.Characters, error) {
	var data *model.Characters
	cacheKey := c.GetCharactersCacheKey(id)
	err := c.cache.Get(ctx, cacheKey, &data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// MultiSet multiple set cache
func (c *charactersCache) MultiSet(ctx context.Context, data []*model.Characters, duration time.Duration) error {
	valMap := make(map[string]interface{})
	for _, v := range data {
		cacheKey := c.GetCharactersCacheKey(v.ID)
		valMap[cacheKey] = v
	}

	err := c.cache.MultiSet(ctx, valMap, duration)
	if err != nil {
		return err
	}

	return nil
}

// MultiGet multiple get cache, return key in map is id value
func (c *charactersCache) MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.Characters, error) {
	var keys []string
	for _, v := range ids {
		cacheKey := c.GetCharactersCacheKey(v)
		keys = append(keys, cacheKey)
	}

	itemMap := make(map[string]*model.Characters)
	err := c.cache.MultiGet(ctx, keys, itemMap)
	if err != nil {
		return nil, err
	}

	retMap := make(map[uint64]*model.Characters)
	for _, id := range ids {
		val, ok := itemMap[c.GetCharactersCacheKey(id)]
		if ok {
			retMap[id] = val
		}
	}

	return retMap, nil
}

// Del delete cache
func (c *charactersCache) Del(ctx context.Context, id uint64) error {
	cacheKey := c.GetCharactersCacheKey(id)
	err := c.cache.Del(ctx, cacheKey)
	if err != nil {
		return err
	}
	return nil
}

// SetPlaceholder set placeholder value to cache
func (c *charactersCache) SetPlaceholder(ctx context.Context, id uint64) error {
	cacheKey := c.GetCharactersCacheKey(id)
	return c.cache.SetCacheWithNotFound(ctx, cacheKey)
}

// IsPlaceholderErr check if cache is placeholder error
func (c *charactersCache) IsPlaceholderErr(err error) bool {
	return errors.Is(err, cache.ErrPlaceholder)
}
