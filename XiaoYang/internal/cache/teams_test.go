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

func newTeamsCache() *gotest.Cache {
	record1 := &model.Teams{}
	record1.ID = 1
	record2 := &model.Teams{}
	record2.ID = 2
	testData := map[string]interface{}{
		utils.Uint64ToStr(record1.ID): record1,
		utils.Uint64ToStr(record2.ID): record2,
	}

	c := gotest.NewCache(testData)
	c.ICache = NewTeamsCache(&database.CacheType{
		CType: "redis",
		Rdb:   c.RedisClient,
	})
	return c
}

func Test_teamsCache_Set(t *testing.T) {
	c := newTeamsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Teams)
	err := c.ICache.(TeamsCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	// nil data
	err = c.ICache.(TeamsCache).Set(c.Ctx, 0, nil, time.Hour)
	assert.NoError(t, err)
}

func Test_teamsCache_Get(t *testing.T) {
	c := newTeamsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Teams)
	err := c.ICache.(TeamsCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(TeamsCache).Get(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, record, got)

	// zero key error
	_, err = c.ICache.(TeamsCache).Get(c.Ctx, 0)
	assert.Error(t, err)
}

func Test_teamsCache_MultiGet(t *testing.T) {
	c := newTeamsCache()
	defer c.Close()

	var testData []*model.Teams
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Teams))
	}

	err := c.ICache.(TeamsCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(TeamsCache).MultiGet(c.Ctx, c.GetIDs())
	if err != nil {
		t.Fatal(err)
	}

	expected := c.GetTestData()
	for k, v := range expected {
		assert.Equal(t, got[utils.StrToUint64(k)], v.(*model.Teams))
	}
}

func Test_teamsCache_MultiSet(t *testing.T) {
	c := newTeamsCache()
	defer c.Close()

	var testData []*model.Teams
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Teams))
	}

	err := c.ICache.(TeamsCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_teamsCache_Del(t *testing.T) {
	c := newTeamsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Teams)
	err := c.ICache.(TeamsCache).Del(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_teamsCache_SetCacheWithNotFound(t *testing.T) {
	c := newTeamsCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Teams)
	err := c.ICache.(TeamsCache).SetPlaceholder(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	b := c.ICache.(TeamsCache).IsPlaceholderErr(err)
	t.Log(b)
}

func TestNewTeamsCache(t *testing.T) {
	c := NewTeamsCache(&database.CacheType{
		CType: "",
	})
	assert.Nil(t, c)
	c = NewTeamsCache(&database.CacheType{
		CType: "memory",
	})
	assert.NotNil(t, c)
	c = NewTeamsCache(&database.CacheType{
		CType: "redis",
	})
	assert.NotNil(t, c)
}
