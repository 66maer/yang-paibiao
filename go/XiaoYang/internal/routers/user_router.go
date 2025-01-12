// Code generated by https://github.com/zhufuyi/sponge

package routers

import (
	"github.com/gin-gonic/gin"

	"github.com/zhufuyi/sponge/pkg/logger"
	//"github.com/zhufuyi/sponge/pkg/middleware"

	XiaoYangV1 "XiaoYang/api/XiaoYang/v1"
	"XiaoYang/internal/handler"
)

func init() {
	allMiddlewareFns = append(allMiddlewareFns, func(c *middlewareConfig) {
		userServiceMiddlewares(c)
	})

	allRouteFns = append(allRouteFns,
		func(r *gin.Engine, groupPathMiddlewares map[string][]gin.HandlerFunc, singlePathMiddlewares map[string][]gin.HandlerFunc) {
			userServiceRouter(r, groupPathMiddlewares, singlePathMiddlewares, handler.NewUserServiceHandler())
		})
}

func userServiceRouter(
	r *gin.Engine,
	groupPathMiddlewares map[string][]gin.HandlerFunc,
	singlePathMiddlewares map[string][]gin.HandlerFunc,
	iService XiaoYangV1.UserServiceLogicer) {
	XiaoYangV1.RegisterUserServiceRouter(
		r,
		groupPathMiddlewares,
		singlePathMiddlewares,
		iService,
		XiaoYangV1.WithUserServiceLogger(logger.Get()),
		XiaoYangV1.WithUserServiceHTTPResponse(),
		XiaoYangV1.WithUserServiceErrorToHTTPCode(
		// Set some error codes to standard http return codes,
		// by default there is already ecode.InternalServerError and ecode.ServiceUnavailable
		// example:
		// 	ecode.Forbidden, ecode.LimitExceed,
		),
	)
}

// you can set the middleware of a route group, or set the middleware of a single route,
// or you can mix them, pay attention to the duplication of middleware when mixing them,
// it is recommended to set the middleware of a single route in preference
func userServiceMiddlewares(c *middlewareConfig) {
	// set up group route middleware, group path is left prefix rules,
	// if the left prefix is hit, the middleware will take effect, e.g. group route is /api/v1, route /api/v1/userService/:id  will take effect
	// c.setGroupPath("/api/v1/userService", middleware.Auth())

	// set up single route middleware, just uncomment the code and fill in the middlewares, nothing else needs to be changed
	//c.setSinglePath("POST", "/api/v1/auth/register", middleware.Auth())    // Register 注册
	//c.setSinglePath("POST", "/api/v1/auth/login", middleware.Auth())    // Login 登录
	//c.setSinglePath("POST", "/api/v1/auth/logout", middleware.Auth())    // Logout 登出
	//c.setSinglePath("POST", "/api/v1/user/getUserInfo", middleware.Auth())    // GetUserInfo 获取用户信息
	//c.setSinglePath("POST", "/v1/user/updateUserInfo", middleware.Auth())    // UpdateUserInfo 更新用户信息
	//c.setSinglePath("PUT", "/v1/user/changePassword", middleware.Auth())    // ChangePassword 修改密码
	//c.setSinglePath("POST", "/v1/user/changePassword", middleware.Auth())    // ChangePassword 修改密码
}
