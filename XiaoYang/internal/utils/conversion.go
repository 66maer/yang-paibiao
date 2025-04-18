package utils

import (
	"encoding/json"
	"time"

	"gorm.io/datatypes"
)

// Uint64ToTimePtr 将 uint64 转换为 *time.Time
func Uint64ToTimePtr(t uint64) *time.Time {
	if t == 0 {
		return nil
	}
	tt := time.Unix(int64(t), 0)
	return &tt
}

// StringToJSONPtr 将 string 转换为 *datatypes.JSON
func StringToJSONPtr(s string) *datatypes.JSON {
	if s == "" {
		return nil
	}
	j := datatypes.JSON([]byte(s))
	return &j
}

// TimePtrToUint64 将 *time.Time 转换为 uint64
func TimePtrToUint64(t *time.Time) uint64 {
	if t == nil {
		return 0
	}
	return uint64(t.Unix())
}

// JSONPtrToString 将 *datatypes.JSON 转换为 string
func JSONPtrToString(j *datatypes.JSON) string {
	if j == nil {
		return ""
	}
	return string(*j)
}

// TimePtrToISO8601 将 *time.Time 转换为 ISO8601 字符串
func TimePtrToISO8601(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format(time.RFC3339)
}

// ISO8601ToTimePtr 将 ISO8601 字符串转换为 *time.Time
func ISO8601ToTimePtr(s string) *time.Time {
	if s == "" {
		return nil
	}
	tt, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return nil
	}
	localTime := tt.UTC()
	return &localTime
}

// NowUTCPointer 返回当前时间的指针
func NowUTCPointer() *time.Time {
	t := time.Now().UTC()
	return &t
}

// UpdateJSONField 更新 *datatypes.JSON 中的指定字段
func UpdateJSONField(j *datatypes.JSON, key string, value interface{}) {
	if j == nil {
		return
	}

	var data map[string]interface{}
	if err := json.Unmarshal(*j, &data); err != nil {
		return
	}

	data[key] = value
	updatedJSON, err := json.Marshal(data)
	if err != nil {
		return
	}

	*j = datatypes.JSON(updatedJSON)
}
