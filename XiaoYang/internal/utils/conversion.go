package utils

import (
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
