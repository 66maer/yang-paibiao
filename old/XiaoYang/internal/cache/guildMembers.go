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
	guildMembersCachePrefixKey = "guildMembers:"
	// GuildMembersExpireTime expire time
	GuildMembersExpireTime = 5 * time.Minute
)

var _ GuildMembersCache = (*guildMembersCache)(nil)

// GuildMembersCache cache interface
type GuildMembersCache interface {
	Set(ctx context.Context, id uint64, data *model.GuildMembers, duration time.Duration) error
	Get(ctx context.Context, id uint64) (*model.GuildMembers, error)
	MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.GuildMembers, error)
	MultiSet(ctx context.Context, data []*model.GuildMembers, duration time.Duration) error
	Del(ctx context.Context, id uint64) error
	SetPlaceholder(ctx context.Context, id uint64) error
	IsPlaceholderErr(err error) bool
}

// guildMembersCache define a cache struct
type guildMembersCache struct {
	cache cache.Cache
}

// NewGuildMembersCache new a cache
func NewGuildMembersCache(cacheType *database.CacheType) GuildMembersCache {
	jsonEncoding := encoding.JSONEncoding{}
	cachePrefix := ""

	cType := strings.ToLower(cacheType.CType)
	switch cType {
	case "redis":
		c := cache.NewRedisCache(cacheType.Rdb, cachePrefix, jsonEncoding, func() interface{} {
			return &model.GuildMembers{}
		})
		return &guildMembersCache{cache: c}
	case "memory":
		c := cache.NewMemoryCache(cachePrefix, jsonEncoding, func() interface{} {
			return &model.GuildMembers{}
		})
		return &guildMembersCache{cache: c}
	}

	return nil // no cache
}

// GetGuildMembersCacheKey cache key
func (c *guildMembersCache) GetGuildMembersCacheKey(id uint64) string {
	return guildMembersCachePrefixKey + utils.Uint64ToStr(id)
}

// Set write to cache
func (c *guildMembersCache) Set(ctx context.Context, id uint64, data *model.GuildMembers, duration time.Duration) error {
	if data == nil || id == 0 {
		return nil
	}
	cacheKey := c.GetGuildMembersCacheKey(id)
	err := c.cache.Set(ctx, cacheKey, data, duration)
	if err != nil {
		return err
	}
	return nil
}

// Get cache value
func (c *guildMembersCache) Get(ctx context.Context, id uint64) (*model.GuildMembers, error) {
	var data *model.GuildMembers
	cacheKey := c.GetGuildMembersCacheKey(id)
	err := c.cache.Get(ctx, cacheKey, &data)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// MultiSet multiple set cache
func (c *guildMembersCache) MultiSet(ctx context.Context, data []*model.GuildMembers, duration time.Duration) error {
	valMap := make(map[string]interface{})
	for _, v := range data {
		cacheKey := c.GetGuildMembersCacheKey(v.ID)
		valMap[cacheKey] = v
	}

	err := c.cache.MultiSet(ctx, valMap, duration)
	if err != nil {
		return err
	}

	return nil
}

// MultiGet multiple get cache, return key in map is id value
func (c *guildMembersCache) MultiGet(ctx context.Context, ids []uint64) (map[uint64]*model.GuildMembers, error) {
	var keys []string
	for _, v := range ids {
		cacheKey := c.GetGuildMembersCacheKey(v)
		keys = append(keys, cacheKey)
	}

	itemMap := make(map[string]*model.GuildMembers)
	err := c.cache.MultiGet(ctx, keys, itemMap)
	if err != nil {
		return nil, err
	}

	retMap := make(map[uint64]*model.GuildMembers)
	for _, id := range ids {
		val, ok := itemMap[c.GetGuildMembersCacheKey(id)]
		if ok {
			retMap[id] = val
		}
	}

	return retMap, nil
}

// Del delete cache
func (c *guildMembersCache) Del(ctx context.Context, id uint64) error {
	cacheKey := c.GetGuildMembersCacheKey(id)
	err := c.cache.Del(ctx, cacheKey)
	if err != nil {
		return err
	}
	return nil
}

// SetPlaceholder set placeholder value to cache
func (c *guildMembersCache) SetPlaceholder(ctx context.Context, id uint64) error {
	cacheKey := c.GetGuildMembersCacheKey(id)
	return c.cache.SetCacheWithNotFound(ctx, cacheKey)
}

// IsPlaceholderErr check if cache is placeholder error
func (c *guildMembersCache) IsPlaceholderErr(err error) bool {
	return errors.Is(err, cache.ErrPlaceholder)
}
