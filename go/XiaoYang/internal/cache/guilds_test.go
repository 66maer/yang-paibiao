package cache

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/zhufuyi/sponge/pkg/gotest"
	"github.com/zhufuyi/sponge/pkg/utils"

	"XiaoYang/internal/database"
	"XiaoYang/internal/model"
)

func newGuildsCache() *gotest.Cache {
	record1 := &model.Guilds{}
	record1.ID = 1
	record2 := &model.Guilds{}
	record2.ID = 2
	testData := map[string]interface{}{
		utils.Uint64ToStr(record1.ID): record1,
		utils.Uint64ToStr(record2.ID): record2,
	}

	c := gotest.NewCache(testData)
	c.ICache = NewGuildsCache(&database.CacheType{
		CType: "redis",
		Rdb:   c.RedisClient,
	})
	return c
}

func Test_guildsCache_Set(t *testing.T) {
	c := newGuildsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Guilds)
	err := c.ICache.(GuildsCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	// nil data
	err = c.ICache.(GuildsCache).Set(c.Ctx, 0, nil, time.Hour)
	assert.NoError(t, err)
}

func Test_guildsCache_Get(t *testing.T) {
	c := newGuildsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Guilds)
	err := c.ICache.(GuildsCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(GuildsCache).Get(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, record, got)

	// zero key error
	_, err = c.ICache.(GuildsCache).Get(c.Ctx, 0)
	assert.Error(t, err)
}

func Test_guildsCache_MultiGet(t *testing.T) {
	c := newGuildsCache()
	defer c.Close()

	var testData []*model.Guilds
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Guilds))
	}

	err := c.ICache.(GuildsCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(GuildsCache).MultiGet(c.Ctx, c.GetIDs())
	if err != nil {
		t.Fatal(err)
	}

	expected := c.GetTestData()
	for k, v := range expected {
		assert.Equal(t, got[utils.StrToUint64(k)], v.(*model.Guilds))
	}
}

func Test_guildsCache_MultiSet(t *testing.T) {
	c := newGuildsCache()
	defer c.Close()

	var testData []*model.Guilds
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Guilds))
	}

	err := c.ICache.(GuildsCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_guildsCache_Del(t *testing.T) {
	c := newGuildsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Guilds)
	err := c.ICache.(GuildsCache).Del(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_guildsCache_SetCacheWithNotFound(t *testing.T) {
	c := newGuildsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Guilds)
	err := c.ICache.(GuildsCache).SetPlaceholder(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	b := c.ICache.(GuildsCache).IsPlaceholderErr(err)
	t.Log(b)
}

func TestNewGuildsCache(t *testing.T) {
	c := NewGuildsCache(&database.CacheType{
		CType: "",
	})
	assert.Nil(t, c)
	c = NewGuildsCache(&database.CacheType{
		CType: "memory",
	})
	assert.NotNil(t, c)
	c = NewGuildsCache(&database.CacheType{
		CType: "redis",
	})
	assert.NotNil(t, c)
}
