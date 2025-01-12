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

func newTeamTemplatesCache() *gotest.Cache {
	record1 := &model.TeamTemplates{}
	record1.ID = 1
	record2 := &model.TeamTemplates{}
	record2.ID = 2
	testData := map[string]interface{}{
		utils.Uint64ToStr(record1.ID): record1,
		utils.Uint64ToStr(record2.ID): record2,
	}

	c := gotest.NewCache(testData)
	c.ICache = NewTeamTemplatesCache(&database.CacheType{
		CType: "redis",
		Rdb:   c.RedisClient,
	})
	return c
}

func Test_teamTemplatesCache_Set(t *testing.T) {
	c := newTeamTemplatesCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.TeamTemplates)
	err := c.ICache.(TeamTemplatesCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	// nil data
	err = c.ICache.(TeamTemplatesCache).Set(c.Ctx, 0, nil, time.Hour)
	assert.NoError(t, err)
}

func Test_teamTemplatesCache_Get(t *testing.T) {
	c := newTeamTemplatesCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.TeamTemplates)
	err := c.ICache.(TeamTemplatesCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(TeamTemplatesCache).Get(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, record, got)

	// zero key error
	_, err = c.ICache.(TeamTemplatesCache).Get(c.Ctx, 0)
	assert.Error(t, err)
}

func Test_teamTemplatesCache_MultiGet(t *testing.T) {
	c := newTeamTemplatesCache()
	defer c.Close()

	var testData []*model.TeamTemplates
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.TeamTemplates))
	}

	err := c.ICache.(TeamTemplatesCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(TeamTemplatesCache).MultiGet(c.Ctx, c.GetIDs())
	if err != nil {
		t.Fatal(err)
	}

	expected := c.GetTestData()
	for k, v := range expected {
		assert.Equal(t, got[utils.StrToUint64(k)], v.(*model.TeamTemplates))
	}
}

func Test_teamTemplatesCache_MultiSet(t *testing.T) {
	c := newTeamTemplatesCache()
	defer c.Close()

	var testData []*model.TeamTemplates
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.TeamTemplates))
	}

	err := c.ICache.(TeamTemplatesCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_teamTemplatesCache_Del(t *testing.T) {
	c := newTeamTemplatesCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.TeamTemplates)
	err := c.ICache.(TeamTemplatesCache).Del(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_teamTemplatesCache_SetCacheWithNotFound(t *testing.T) {
	c := newTeamTemplatesCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.TeamTemplates)
	err := c.ICache.(TeamTemplatesCache).SetPlaceholder(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	b := c.ICache.(TeamTemplatesCache).IsPlaceholderErr(err)
	t.Log(b)
}

func TestNewTeamTemplatesCache(t *testing.T) {
	c := NewTeamTemplatesCache(&database.CacheType{
		CType: "",
	})
	assert.Nil(t, c)
	c = NewTeamTemplatesCache(&database.CacheType{
		CType: "memory",
	})
	assert.NotNil(t, c)
	c = NewTeamTemplatesCache(&database.CacheType{
		CType: "redis",
	})
	assert.NotNil(t, c)
}
