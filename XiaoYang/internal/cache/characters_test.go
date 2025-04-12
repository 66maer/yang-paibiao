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

func newCharactersCache() *gotest.Cache {
	record1 := &model.Characters{}
	record1.ID = 1
	record2 := &model.Characters{}
	record2.ID = 2
	testData := map[string]interface{}{
		utils.Uint64ToStr(record1.ID): record1,
		utils.Uint64ToStr(record2.ID): record2,
	}

	c := gotest.NewCache(testData)
	c.ICache = NewCharactersCache(&database.CacheType{
		CType: "redis",
		Rdb:   c.RedisClient,
	})
	return c
}

func Test_charactersCache_Set(t *testing.T) {
	c := newCharactersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Characters)
	err := c.ICache.(CharactersCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	// nil data
	err = c.ICache.(CharactersCache).Set(c.Ctx, 0, nil, time.Hour)
	assert.NoError(t, err)
}

func Test_charactersCache_Get(t *testing.T) {
	c := newCharactersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Characters)
	err := c.ICache.(CharactersCache).Set(c.Ctx, record.ID, record, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(CharactersCache).Get(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, record, got)

	// zero key error
	_, err = c.ICache.(CharactersCache).Get(c.Ctx, 0)
	assert.Error(t, err)
}

func Test_charactersCache_MultiGet(t *testing.T) {
	c := newCharactersCache()
	defer c.Close()

	var testData []*model.Characters
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Characters))
	}

	err := c.ICache.(CharactersCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}

	got, err := c.ICache.(CharactersCache).MultiGet(c.Ctx, c.GetIDs())
	if err != nil {
		t.Fatal(err)
	}

	expected := c.GetTestData()
	for k, v := range expected {
		assert.Equal(t, got[utils.StrToUint64(k)], v.(*model.Characters))
	}
}

func Test_charactersCache_MultiSet(t *testing.T) {
	c := newCharactersCache()
	defer c.Close()

	var testData []*model.Characters
	for _, data := range c.TestDataSlice {
		testData = append(testData, data.(*model.Characters))
	}

	err := c.ICache.(CharactersCache).MultiSet(c.Ctx, testData, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_charactersCache_Del(t *testing.T) {
	c := newCharactersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Characters)
	err := c.ICache.(CharactersCache).Del(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
}

func Test_charactersCache_SetCacheWithNotFound(t *testing.T) {
	c := newCharactersCache()
	defer c.Close()

	record := c.TestDataSlice[0].(*model.Characters)
	err := c.ICache.(CharactersCache).SetPlaceholder(c.Ctx, record.ID)
	if err != nil {
		t.Fatal(err)
	}
	b := c.ICache.(CharactersCache).IsPlaceholderErr(err)
	t.Log(b)
}

func TestNewCharactersCache(t *testing.T) {
	c := NewCharactersCache(&database.CacheType{
		CType: "",
	})
	assert.Nil(t, c)
	c = NewCharactersCache(&database.CacheType{
		CType: "memory",
	})
	assert.NotNil(t, c)
	c = NewCharactersCache(&database.CacheType{
		CType: "redis",
	})
	assert.NotNil(t, c)
}
