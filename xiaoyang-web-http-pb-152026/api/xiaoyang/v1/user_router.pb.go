// Code generated by https://github.com/zhufuyi/sponge, DO NOT EDIT.

package v1

import (
	context "context"
	gin "github.com/gin-gonic/gin"
	errcode "github.com/zhufuyi/sponge/pkg/errcode"
	middleware "github.com/zhufuyi/sponge/pkg/gin/middleware"
	zap "go.uber.org/zap"
	strings "strings"
)

// import packages: strings. context. errcode. middleware. zap. gin.

type UserServiceLogicer interface {
	Register(ctx context.Context, req *RegisterRequest) (*RegisterResponse, error)
	Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error)
	Logout(ctx context.Context, req *LogoutRequest) (*LogoutResponse, error)
	GetUserInfo(ctx context.Context, req *GetUserInfoRequest) (*GetUserInfoResponse, error)
	UpdateUserInfo(ctx context.Context, req *UpdateUserInfoRequest) (*UpdateUserInfoResponse, error)
	ChangePassword(ctx context.Context, req *ChangePasswordRequest) (*ChangePasswordResponse, error)
}

type UserServiceOption func(*userServiceOptions)

type userServiceOptions struct {
	isFromRPC  bool
	responser  errcode.Responser
	zapLog     *zap.Logger
	httpErrors []*errcode.Error
	rpcStatus  []*errcode.RPCStatus
	wrapCtxFn  func(c *gin.Context) context.Context
}

func (o *userServiceOptions) apply(opts ...UserServiceOption) {
	for _, opt := range opts {
		opt(o)
	}
}

func WithUserServiceHTTPResponse() UserServiceOption {
	return func(o *userServiceOptions) {
		o.isFromRPC = false
	}
}

func WithUserServiceRPCResponse() UserServiceOption {
	return func(o *userServiceOptions) {
		o.isFromRPC = true
	}
}

func WithUserServiceResponser(responser errcode.Responser) UserServiceOption {
	return func(o *userServiceOptions) {
		o.responser = responser
	}
}

func WithUserServiceLogger(zapLog *zap.Logger) UserServiceOption {
	return func(o *userServiceOptions) {
		o.zapLog = zapLog
	}
}

func WithUserServiceErrorToHTTPCode(e ...*errcode.Error) UserServiceOption {
	return func(o *userServiceOptions) {
		o.httpErrors = e
	}
}

func WithUserServiceRPCStatusToHTTPCode(s ...*errcode.RPCStatus) UserServiceOption {
	return func(o *userServiceOptions) {
		o.rpcStatus = s
	}
}

func WithUserServiceWrapCtx(wrapCtxFn func(c *gin.Context) context.Context) UserServiceOption {
	return func(o *userServiceOptions) {
		o.wrapCtxFn = wrapCtxFn
	}
}

func RegisterUserServiceRouter(
	iRouter gin.IRouter,
	groupPathMiddlewares map[string][]gin.HandlerFunc,
	singlePathMiddlewares map[string][]gin.HandlerFunc,
	iLogic UserServiceLogicer,
	opts ...UserServiceOption) {

	o := &userServiceOptions{}
	o.apply(opts...)

	if o.responser == nil {
		o.responser = errcode.NewResponser(o.isFromRPC, o.httpErrors, o.rpcStatus)
	}
	if o.zapLog == nil {
		o.zapLog, _ = zap.NewProduction()
	}

	r := &userServiceRouter{
		iRouter:               iRouter,
		groupPathMiddlewares:  groupPathMiddlewares,
		singlePathMiddlewares: singlePathMiddlewares,
		iLogic:                iLogic,
		iResponse:             o.responser,
		zapLog:                o.zapLog,
		wrapCtxFn:             o.wrapCtxFn,
	}
	r.register()
}

type userServiceRouter struct {
	iRouter               gin.IRouter
	groupPathMiddlewares  map[string][]gin.HandlerFunc
	singlePathMiddlewares map[string][]gin.HandlerFunc
	iLogic                UserServiceLogicer
	iResponse             errcode.Responser
	zapLog                *zap.Logger
	wrapCtxFn             func(c *gin.Context) context.Context
}

func (r *userServiceRouter) register() {
	r.iRouter.Handle("POST", "/v1/auth/register", r.withMiddleware("POST", "/v1/auth/register", r.Register_0)...)
	r.iRouter.Handle("POST", "/v1/auth/login", r.withMiddleware("POST", "/v1/auth/login", r.Login_0)...)
	r.iRouter.Handle("POST", "/v1/auth/logout", r.withMiddleware("POST", "/v1/auth/logout", r.Logout_0)...)
	r.iRouter.Handle("GET", "/v1/user/:qq_number", r.withMiddleware("GET", "/v1/user/:qq_number", r.GetUserInfo_0)...)
	r.iRouter.Handle("PUT", "/v1/user/:qq_number", r.withMiddleware("PUT", "/v1/user/:qq_number", r.UpdateUserInfo_0)...)
	r.iRouter.Handle("PUT", "/v1/user/password/:qq_number", r.withMiddleware("PUT", "/v1/user/password/:qq_number", r.ChangePassword_0)...)

}

func (r *userServiceRouter) withMiddleware(method string, path string, fn gin.HandlerFunc) []gin.HandlerFunc {
	handlerFns := []gin.HandlerFunc{}

	// determine if a route group is hit or miss, left prefix rule
	for groupPath, fns := range r.groupPathMiddlewares {
		if groupPath == "" || groupPath == "/" {
			handlerFns = append(handlerFns, fns...)
			continue
		}
		size := len(groupPath)
		if len(path) < size {
			continue
		}
		if groupPath == path[:size] {
			handlerFns = append(handlerFns, fns...)
		}
	}

	// determine if a single route has been hit
	key := strings.ToUpper(method) + "->" + path
	if fns, ok := r.singlePathMiddlewares[key]; ok {
		handlerFns = append(handlerFns, fns...)
	}

	return append(handlerFns, fn)
}

var _ middleware.CtxKeyString

func (r *userServiceRouter) Register_0(c *gin.Context) {
	req := &RegisterRequest{}
	var err error

	if err = c.ShouldBindJSON(req); err != nil {
		r.zapLog.Warn("ShouldBindJSON error", zap.Error(err), middleware.GCtxRequestIDField(c))
		r.iResponse.ParamError(c, err)
		return
	}

	var ctx context.Context
	if r.wrapCtxFn != nil {
		ctx = r.wrapCtxFn(c)
	} else {
		ctx = middleware.WrapCtx(c)
	}

	out, err := r.iLogic.Register(ctx, req)
	if err != nil {
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *userServiceRouter) Login_0(c *gin.Context) {
	req := &LoginRequest{}
	var err error

	if err = c.ShouldBindJSON(req); err != nil {
		r.zapLog.Warn("ShouldBindJSON error", zap.Error(err), middleware.GCtxRequestIDField(c))
		r.iResponse.ParamError(c, err)
		return
	}

	var ctx context.Context
	if r.wrapCtxFn != nil {
		ctx = r.wrapCtxFn(c)
	} else {
		ctx = middleware.WrapCtx(c)
	}

	out, err := r.iLogic.Login(ctx, req)
	if err != nil {
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *userServiceRouter) Logout_0(c *gin.Context) {
	req := &LogoutRequest{}
	var err error

	if err = c.ShouldBindJSON(req); err != nil {
		r.zapLog.Warn("ShouldBindJSON error", zap.Error(err), middleware.GCtxRequestIDField(c))
		r.iResponse.ParamError(c, err)
		return
	}

	var ctx context.Context
	if r.wrapCtxFn != nil {
		ctx = r.wrapCtxFn(c)
	} else {
		ctx = middleware.WrapCtx(c)
	}

	out, err := r.iLogic.Logout(ctx, req)
	if err != nil {
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *userServiceRouter) GetUserInfo_0(c *gin.Context) {
	req := &GetUserInfoRequest{}
	var err error

	if err = c.ShouldBindUri(req); err != nil {
		r.zapLog.Warn("ShouldBindUri error", zap.Error(err), middleware.GCtxRequestIDField(c))
		r.iResponse.ParamError(c, err)
		return
	}

	if err = c.ShouldBindQuery(req); err != nil {
		r.zapLog.Warn("ShouldBindQuery error", zap.Error(err), middleware.GCtxRequestIDField(c))
		r.iResponse.ParamError(c, err)
		return
	}

	var ctx context.Context
	if r.wrapCtxFn != nil {
		ctx = r.wrapCtxFn(c)
	} else {
		ctx = middleware.WrapCtx(c)
	}

	out, err := r.iLogic.GetUserInfo(ctx, req)
	if err != nil {
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *userServiceRouter) UpdateUserInfo_0(c *gin.Context) {
	req := &UpdateUserInfoRequest{}
	var err error

	if err = c.ShouldBindUri(req); err != nil {
		r.zapLog.Warn("ShouldBindUri error", zap.Error(err), middleware.GCtxRequestIDField(c))
		r.iResponse.ParamError(c, err)
		return
	}

	if err = c.ShouldBindJSON(req); err != nil {
		r.zapLog.Warn("ShouldBindJSON error", zap.Error(err), middleware.GCtxRequestIDField(c))
		r.iResponse.ParamError(c, err)
		return
	}

	var ctx context.Context
	if r.wrapCtxFn != nil {
		ctx = r.wrapCtxFn(c)
	} else {
		ctx = middleware.WrapCtx(c)
	}

	out, err := r.iLogic.UpdateUserInfo(ctx, req)
	if err != nil {
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *userServiceRouter) ChangePassword_0(c *gin.Context) {
	req := &ChangePasswordRequest{}
	var err error

	if err = c.ShouldBindUri(req); err != nil {
		r.zapLog.Warn("ShouldBindUri error", zap.Error(err), middleware.GCtxRequestIDField(c))
		r.iResponse.ParamError(c, err)
		return
	}

	if err = c.ShouldBindJSON(req); err != nil {
		r.zapLog.Warn("ShouldBindJSON error", zap.Error(err), middleware.GCtxRequestIDField(c))
		r.iResponse.ParamError(c, err)
		return
	}

	var ctx context.Context
	if r.wrapCtxFn != nil {
		ctx = r.wrapCtxFn(c)
	} else {
		ctx = middleware.WrapCtx(c)
	}

	out, err := r.iLogic.ChangePassword(ctx, req)
	if err != nil {
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}
