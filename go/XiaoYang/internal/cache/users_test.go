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

func newUsersCache() *gotest.Cache {
	record1 := &model.Users{}
	record1.ID = 1
	record2 := &model.Users{}
	record2.ID = 2
	testData := map[string]interface{}{
		utils.Uint64ToStr(record1.ID): record1,
		utils.Uint64ToStr(record2.ID): record2,
	}

	c := gotest.NewCache(testData)
	c.ICache = NewUsersCache(&database.CacheType{
		CType: "redis",
		Rdb:   c.RedisClient,
	})
	return c
}

func Test_usersCache_Set(t *testing.T) {
	c := newUsersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Users)
	err := c.ICache.(UsersCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	// nil data
	err = c.ICache.(UsersCache).Set(c.Ctx, 0, nil, time.Hour)
	assert.NoError(t, err)
}

func Test_usersCache_Get(t *testing.T) {
	c := newUsersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Users)
	err := c.ICache.(UsersCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(UsersCache).Get(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, record, got)

	// zero key error
	_, err = c.ICache.(UsersCache).Get(c.Ctx, 0)
	assert.Error(t, err)
}

func Test_usersCache_MultiGet(t *testing.T) {
	c := newUsersCache()
	defer c.Close()

	var testData []*model.Users
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Users))
	}

	err := c.ICache.(UsersCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(UsersCache).MultiGet(c.Ctx, c.GetIDs())
	if err != nil {
		t.Fatal(err)
	}

	expected := c.GetTestData()
	for k, v := range expected {
		assert.Equal(t, got[utils.StrToUint64(k)], v.(*model.Users))
	}
}

func Test_usersCache_MultiSet(t *testing.T) {
	c := newUsersCache()
	defer c.Close()

	var testData []*model.Users
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Users))
	}

	err := c.ICache.(UsersCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_usersCache_Del(t *testing.T) {
	c := newUsersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Users)
	err := c.ICache.(UsersCache).Del(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_usersCache_SetCacheWithNotFound(t *testing.T) {
	c := newUsersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Users)
	err := c.ICache.(UsersCache).SetPlaceholder(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	b := c.ICache.(UsersCache).IsPlaceholderErr(err)
	t.Log(b)
}

func TestNewUsersCache(t *testing.T) {
	c := NewUsersCache(&database.CacheType{
		CType: "",
	})
	assert.Nil(t, c)
	c = NewUsersCache(&database.CacheType{
		CType: "memory",
	})
	assert.NotNil(t, c)
	c = NewUsersCache(&database.CacheType{
		CType: "redis",
	})
	assert.NotNil(t, c)
}
