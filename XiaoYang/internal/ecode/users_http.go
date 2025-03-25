package ecode

import (
	"github.com/go-dev-frame/sponge/pkg/errcode"
)

// users business-level http error codes.
// the usersNO value range is 1~100, if the same error code is used, it will cause panic.
var (
	usersNO       = 12
	usersName     = "users"
	usersBaseCode = errcode.HCode(usersNO)

	ErrCreateUsers     = errcode.NewError(usersBaseCode+1, "failed to create "+usersName)
	ErrDeleteByIDUsers = errcode.NewError(usersBaseCode+2, "failed to delete "+usersName)
	ErrUpdateByIDUsers = errcode.NewError(usersBaseCode+3, "failed to update "+usersName)
	ErrGetByIDUsers    = errcode.NewError(usersBaseCode+4, "failed to get "+usersName+" details")
	ErrListUsers       = errcode.NewError(usersBaseCode+5, "failed to list of "+usersName)

	// error codes are globally unique, adding 1 to the previous error code
)
