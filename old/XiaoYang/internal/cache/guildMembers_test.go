package cache

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/go-dev-frame/sponge/pkg/gotest"
	"github.com/go-dev-frame/sponge/pkg/utils"

	"XiaoYang/internal/database"
	"XiaoYang/internal/model"
)

func newGuildMembersCache() *gotest.Cache {
	record1 := &model.GuildMembers{}
	record1.ID = 1
	record2 := &model.GuildMembers{}
	record2.ID = 2
	testData := map[string]interface{}{
		utils.Uint64ToStr(record1.ID): record1,
		utils.Uint64ToStr(record2.ID): record2,
	}

	c := gotest.NewCache(testData)
	c.ICache = NewGuildMembersCache(&database.CacheType{
		CType: "redis",
		Rdb:   c.RedisClient,
	})
	return c
}

func Test_guildMembersCache_Set(t *testing.T) {
	c := newGuildMembersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.GuildMembers)
	err := c.ICache.(GuildMembersCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	// nil data
	err = c.ICache.(GuildMembersCache).Set(c.Ctx, 0, nil, time.Hour)
	assert.NoError(t, err)
}

func Test_guildMembersCache_Get(t *testing.T) {
	c := newGuildMembersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.GuildMembers)
	err := c.ICache.(GuildMembersCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(GuildMembersCache).Get(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, record, got)

	// zero key error
	_, err = c.ICache.(GuildMembersCache).Get(c.Ctx, 0)
	assert.Error(t, err)
}

func Test_guildMembersCache_MultiGet(t *testing.T) {
	c := newGuildMembersCache()
	defer c.Close()

	var testData []*model.GuildMembers
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.GuildMembers))
	}

	err := c.ICache.(GuildMembersCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(GuildMembersCache).MultiGet(c.Ctx, c.GetIDs())
	if err != nil {
		t.Fatal(err)
	}

	expected := c.GetTestData()
	for k, v := range expected {
		assert.Equal(t, got[utils.StrToUint64(k)], v.(*model.GuildMembers))
	}
}

func Test_guildMembersCache_MultiSet(t *testing.T) {
	c := newGuildMembersCache()
	defer c.Close()

	var testData []*model.GuildMembers
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.GuildMembers))
	}

	err := c.ICache.(GuildMembersCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_guildMembersCache_Del(t *testing.T) {
	c := newGuildMembersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.GuildMembers)
	err := c.ICache.(GuildMembersCache).Del(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_guildMembersCache_SetCacheWithNotFound(t *testing.T) {
	c := newGuildMembersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.GuildMembers)
	err := c.ICache.(GuildMembersCache).SetPlaceholder(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	b := c.ICache.(GuildMembersCache).IsPlaceholderErr(err)
	t.Log(b)
}

func TestNewGuildMembersCache(t *testing.T) {
	c := NewGuildMembersCache(&database.CacheType{
		CType: "",
	})
	assert.Nil(t, c)
	c = NewGuildMembersCache(&database.CacheType{
		CType: "memory",
	})
	assert.NotNil(t, c)
	c = NewGuildMembersCache(&database.CacheType{
		CType: "redis",
	})
	assert.NotNil(t, c)
}
