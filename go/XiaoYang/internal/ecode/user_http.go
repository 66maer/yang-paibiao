// Code generated by https://github.com/zhufuyi/sponge

package ecode

import (
	"github.com/zhufuyi/sponge/pkg/errcode"
)

// userService business-level http error codes.
// the userServiceNO value range is 1~100, if the same error code is used, it will cause panic.
var (
	userServiceNO       = 89
	userServiceName     = "userService"
	userServiceBaseCode = errcode.HCode(userServiceNO)

	ErrRegisterUserService       = errcode.NewError(userServiceBaseCode+1, "failed to Register "+userServiceName)
	ErrLoginUserService          = errcode.NewError(userServiceBaseCode+2, "failed to Login "+userServiceName)
	ErrLogoutUserService         = errcode.NewError(userServiceBaseCode+3, "failed to Logout "+userServiceName)
	ErrGetUserInfoUserService    = errcode.NewError(userServiceBaseCode+4, "failed to GetUserInfo "+userServiceName)
	ErrUpdateUserInfoUserService = errcode.NewError(userServiceBaseCode+5, "failed to UpdateUserInfo "+userServiceName)
	ErrChangePasswordUserService = errcode.NewError(userServiceBaseCode+6, "failed to ChangePassword "+userServiceName)

	// error codes are globally unique, adding 1 to the previous error code
)
