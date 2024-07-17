// Code generated by https://github.com/zhufuyi/sponge

package ecode

import (
	"github.com/zhufuyi/sponge/pkg/errcode"
)

// leaguesService business-level http error codes.
// the leaguesServiceNO value range is 1~100, if the same number appears, it will cause a failure to start the service.
var (
	leaguesServiceNO       = 91
	leaguesServiceName     = "leaguesService"
	leaguesServiceBaseCode = errcode.HCode(leaguesServiceNO)

	ErrCreateLeagueLeaguesService          = errcode.NewError(leaguesServiceBaseCode+1, "failed to CreateLeague "+leaguesServiceName)
	ErrListLeaguesLeaguesService           = errcode.NewError(leaguesServiceBaseCode+2, "failed to ListLeagues "+leaguesServiceName)
	ErrGetLeagueLeaguesService             = errcode.NewError(leaguesServiceBaseCode+3, "failed to GetLeague "+leaguesServiceName)
	ErrUpdateLeagueLeaguesService          = errcode.NewError(leaguesServiceBaseCode+4, "failed to UpdateLeague "+leaguesServiceName)
	ErrUpdateLeagueExpiredAtLeaguesService = errcode.NewError(leaguesServiceBaseCode+5, "failed to UpdateLeagueExpiredAt "+leaguesServiceName)
	ErrJoinLeagueLeaguesService            = errcode.NewError(leaguesServiceBaseCode+6, "failed to JoinLeague "+leaguesServiceName)
	ErrSetUserRoleLeaguesService           = errcode.NewError(leaguesServiceBaseCode+7, "failed to SetUserRole "+leaguesServiceName)
	ErrSetUserNicknameLeaguesService       = errcode.NewError(leaguesServiceBaseCode+8, "failed to SetUserNickname "+leaguesServiceName)
	ErrListLeagueMembersLeaguesService     = errcode.NewError(leaguesServiceBaseCode+9, "failed to ListLeagueMembers "+leaguesServiceName)
	// error codes are globally unique, adding 1 to the previous error code
)
