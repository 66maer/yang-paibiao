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

func newSignupsCache() *gotest.Cache {
	record1 := &model.Signups{}
	record1.ID = 1
	record2 := &model.Signups{}
	record2.ID = 2
	testData := map[string]interface{}{
		utils.Uint64ToStr(record1.ID): record1,
		utils.Uint64ToStr(record2.ID): record2,
	}

	c := gotest.NewCache(testData)
	c.ICache = NewSignupsCache(&database.CacheType{
		CType: "redis",
		Rdb:   c.RedisClient,
	})
	return c
}

func Test_signupsCache_Set(t *testing.T) {
	c := newSignupsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Signups)
	err := c.ICache.(SignupsCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	// nil data
	err = c.ICache.(SignupsCache).Set(c.Ctx, 0, nil, time.Hour)
	assert.NoError(t, err)
}

func Test_signupsCache_Get(t *testing.T) {
	c := newSignupsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Signups)
	err := c.ICache.(SignupsCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(SignupsCache).Get(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, record, got)

	// zero key error
	_, err = c.ICache.(SignupsCache).Get(c.Ctx, 0)
	assert.Error(t, err)
}

func Test_signupsCache_MultiGet(t *testing.T) {
	c := newSignupsCache()
	defer c.Close()

	var testData []*model.Signups
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Signups))
	}

	err := c.ICache.(SignupsCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(SignupsCache).MultiGet(c.Ctx, c.GetIDs())
	if err != nil {
		t.Fatal(err)
	}

	expected := c.GetTestData()
	for k, v := range expected {
		assert.Equal(t, got[utils.StrToUint64(k)], v.(*model.Signups))
	}
}

func Test_signupsCache_MultiSet(t *testing.T) {
	c := newSignupsCache()
	defer c.Close()

	var testData []*model.Signups
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Signups))
	}

	err := c.ICache.(SignupsCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_signupsCache_Del(t *testing.T) {
	c := newSignupsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Signups)
	err := c.ICache.(SignupsCache).Del(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_signupsCache_SetCacheWithNotFound(t *testing.T) {
	c := newSignupsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Signups)
	err := c.ICache.(SignupsCache).SetPlaceholder(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	b := c.ICache.(SignupsCache).IsPlaceholderErr(err)
	t.Log(b)
}

func TestNewSignupsCache(t *testing.T) {
	c := NewSignupsCache(&database.CacheType{
		CType: "",
	})
	assert.Nil(t, c)
	c = NewSignupsCache(&database.CacheType{
		CType: "memory",
	})
	assert.NotNil(t, c)
	c = NewSignupsCache(&database.CacheType{
		CType: "redis",
	})
	assert.NotNil(t, c)
}
