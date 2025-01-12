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

func newLogsCache() *gotest.Cache {
	record1 := &model.Logs{}
	record1.ID = 1
	record2 := &model.Logs{}
	record2.ID = 2
	testData := map[string]interface{}{
		utils.Uint64ToStr(record1.ID): record1,
		utils.Uint64ToStr(record2.ID): record2,
	}

	c := gotest.NewCache(testData)
	c.ICache = NewLogsCache(&database.CacheType{
		CType: "redis",
		Rdb:   c.RedisClient,
	})
	return c
}

func Test_logsCache_Set(t *testing.T) {
	c := newLogsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Logs)
	err := c.ICache.(LogsCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	// nil data
	err = c.ICache.(LogsCache).Set(c.Ctx, 0, nil, time.Hour)
	assert.NoError(t, err)
}

func Test_logsCache_Get(t *testing.T) {
	c := newLogsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Logs)
	err := c.ICache.(LogsCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(LogsCache).Get(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, record, got)

	// zero key error
	_, err = c.ICache.(LogsCache).Get(c.Ctx, 0)
	assert.Error(t, err)
}

func Test_logsCache_MultiGet(t *testing.T) {
	c := newLogsCache()
	defer c.Close()

	var testData []*model.Logs
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Logs))
	}

	err := c.ICache.(LogsCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(LogsCache).MultiGet(c.Ctx, c.GetIDs())
	if err != nil {
		t.Fatal(err)
	}

	expected := c.GetTestData()
	for k, v := range expected {
		assert.Equal(t, got[utils.StrToUint64(k)], v.(*model.Logs))
	}
}

func Test_logsCache_MultiSet(t *testing.T) {
	c := newLogsCache()
	defer c.Close()

	var testData []*model.Logs
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Logs))
	}

	err := c.ICache.(LogsCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_logsCache_Del(t *testing.T) {
	c := newLogsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Logs)
	err := c.ICache.(LogsCache).Del(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_logsCache_SetCacheWithNotFound(t *testing.T) {
	c := newLogsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Logs)
	err := c.ICache.(LogsCache).SetPlaceholder(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	b := c.ICache.(LogsCache).IsPlaceholderErr(err)
	t.Log(b)
}

func TestNewLogsCache(t *testing.T) {
	c := NewLogsCache(&database.CacheType{
		CType: "",
	})
	assert.Nil(t, c)
	c = NewLogsCache(&database.CacheType{
		CType: "memory",
	})
	assert.NotNil(t, c)
	c = NewLogsCache(&database.CacheType{
		CType: "redis",
	})
	assert.NotNil(t, c)
}
