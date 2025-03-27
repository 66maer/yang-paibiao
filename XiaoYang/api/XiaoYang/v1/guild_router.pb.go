// Code generated by https://github.com/go-dev-frame/sponge, DO NOT EDIT.

package v1

import (
	"context"
	"errors"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/go-dev-frame/sponge/pkg/errcode"
	"github.com/go-dev-frame/sponge/pkg/gin/middleware"
)

type GuildServiceLogicer interface {
	CreateGuild(ctx context.Context, req *CreateGuildRequest) (*CreateGuildResponse, error)
	DeleteGuild(ctx context.Context, req *DeleteGuildRequest) (*DeleteGuildResponse, error)
	UpdateGuildInfo(ctx context.Context, req *UpdateGuildInfoRequest) (*UpdateGuildInfoResponse, error)
	GetGuildInfo(ctx context.Context, req *GetGuildInfoRequest) (*GetGuildInfoResponse, error)
	ListAllGuilds(ctx context.Context, req *ListAllGuildsRequest) (*ListAllGuildsResponse, error)
	ListUserGuilds(ctx context.Context, req *ListUserGuildsRequest) (*ListUserGuildsResponse, error)
	ListGuildMembers(ctx context.Context, req *ListGuildMembersRequest) (*ListGuildMembersResponse, error)
	AddGuildMember(ctx context.Context, req *AddGuildMemberRequest) (*AddGuildMemberResponse, error)
	RemoveGuildMember(ctx context.Context, req *RemoveGuildMemberRequest) (*RemoveGuildMemberResponse, error)
	UpdateGuildMember(ctx context.Context, req *UpdateGuildMemberRequest) (*UpdateGuildMemberResponse, error)
	GetGuildMember(ctx context.Context, req *GetGuildMemberRequest) (*GetGuildMemberResponse, error)
}

type GuildServiceOption func(*guildServiceOptions)

type guildServiceOptions struct {
	isFromRPC  bool
	responser  errcode.Responser
	zapLog     *zap.Logger
	httpErrors []*errcode.Error
	rpcStatus  []*errcode.RPCStatus
	wrapCtxFn  func(c *gin.Context) context.Context
}

func (o *guildServiceOptions) apply(opts ...GuildServiceOption) {
	for _, opt := range opts {
		opt(o)
	}
}

func WithGuildServiceHTTPResponse() GuildServiceOption {
	return func(o *guildServiceOptions) {
		o.isFromRPC = false
	}
}

func WithGuildServiceRPCResponse() GuildServiceOption {
	return func(o *guildServiceOptions) {
		o.isFromRPC = true
	}
}

func WithGuildServiceResponser(responser errcode.Responser) GuildServiceOption {
	return func(o *guildServiceOptions) {
		o.responser = responser
	}
}

func WithGuildServiceLogger(zapLog *zap.Logger) GuildServiceOption {
	return func(o *guildServiceOptions) {
		o.zapLog = zapLog
	}
}

func WithGuildServiceErrorToHTTPCode(e ...*errcode.Error) GuildServiceOption {
	return func(o *guildServiceOptions) {
		o.httpErrors = e
	}
}

func WithGuildServiceRPCStatusToHTTPCode(s ...*errcode.RPCStatus) GuildServiceOption {
	return func(o *guildServiceOptions) {
		o.rpcStatus = s
	}
}

func WithGuildServiceWrapCtx(wrapCtxFn func(c *gin.Context) context.Context) GuildServiceOption {
	return func(o *guildServiceOptions) {
		o.wrapCtxFn = wrapCtxFn
	}
}

func RegisterGuildServiceRouter(
	iRouter gin.IRouter,
	groupPathMiddlewares map[string][]gin.HandlerFunc,
	singlePathMiddlewares map[string][]gin.HandlerFunc,
	iLogic GuildServiceLogicer,
	opts ...GuildServiceOption) {

	o := &guildServiceOptions{}
	o.apply(opts...)

	if o.responser == nil {
		o.responser = errcode.NewResponser(o.isFromRPC, o.httpErrors, o.rpcStatus)
	}
	if o.zapLog == nil {
		o.zapLog, _ = zap.NewProduction()
	}

	r := &guildServiceRouter{
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

type guildServiceRouter struct {
	iRouter               gin.IRouter
	groupPathMiddlewares  map[string][]gin.HandlerFunc
	singlePathMiddlewares map[string][]gin.HandlerFunc
	iLogic                GuildServiceLogicer
	iResponse             errcode.Responser
	zapLog                *zap.Logger
	wrapCtxFn             func(c *gin.Context) context.Context
}

func (r *guildServiceRouter) register() {
	r.iRouter.Handle("POST", "/api/v1/guild/createGuild", r.withMiddleware("POST", "/api/v1/guild/createGuild", r.CreateGuild_0)...)
	r.iRouter.Handle("POST", "/api/v1/guild/deleteGuild", r.withMiddleware("POST", "/api/v1/guild/deleteGuild", r.DeleteGuild_0)...)
	r.iRouter.Handle("POST", "/api/v1/guild/updateGuildInfo", r.withMiddleware("POST", "/api/v1/guild/updateGuildInfo", r.UpdateGuildInfo_0)...)
	r.iRouter.Handle("POST", "/api/v1/guild/getGuildInfo", r.withMiddleware("POST", "/api/v1/guild/getGuildInfo", r.GetGuildInfo_0)...)
	r.iRouter.Handle("POST", "/api/v1/guild/listAllGuilds", r.withMiddleware("POST", "/api/v1/guild/listAllGuilds", r.ListAllGuilds_0)...)
	r.iRouter.Handle("POST", "/api/v1/guild/listUserGuilds", r.withMiddleware("POST", "/api/v1/guild/listUserGuilds", r.ListUserGuilds_0)...)
	r.iRouter.Handle("POST", "/api/v1/guild/listGuildMembers", r.withMiddleware("POST", "/api/v1/guild/listGuildMembers", r.ListGuildMembers_0)...)
	r.iRouter.Handle("POST", "/api/v1/guild/addGuildMember", r.withMiddleware("POST", "/api/v1/guild/addGuildMember", r.AddGuildMember_0)...)
	r.iRouter.Handle("POST", "/api/v1/guild/removeGuildMember", r.withMiddleware("POST", "/api/v1/guild/removeGuildMember", r.RemoveGuildMember_0)...)
	r.iRouter.Handle("POST", "/api/v1/guild/updateGuildMember", r.withMiddleware("POST", "/api/v1/guild/updateGuildMember", r.UpdateGuildMember_0)...)
	r.iRouter.Handle("POST", "/api/v1/guild/getGuildMember", r.withMiddleware("POST", "/api/v1/guild/getGuildMember", r.GetGuildMember_0)...)

}

func (r *guildServiceRouter) withMiddleware(method string, path string, fn gin.HandlerFunc) []gin.HandlerFunc {
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

func (r *guildServiceRouter) CreateGuild_0(c *gin.Context) {
	req := &CreateGuildRequest{}
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

	out, err := r.iLogic.CreateGuild(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *guildServiceRouter) DeleteGuild_0(c *gin.Context) {
	req := &DeleteGuildRequest{}
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

	out, err := r.iLogic.DeleteGuild(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *guildServiceRouter) UpdateGuildInfo_0(c *gin.Context) {
	req := &UpdateGuildInfoRequest{}
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

	out, err := r.iLogic.UpdateGuildInfo(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *guildServiceRouter) GetGuildInfo_0(c *gin.Context) {
	req := &GetGuildInfoRequest{}
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

	out, err := r.iLogic.GetGuildInfo(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *guildServiceRouter) ListAllGuilds_0(c *gin.Context) {
	req := &ListAllGuildsRequest{}
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

	out, err := r.iLogic.ListAllGuilds(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *guildServiceRouter) ListUserGuilds_0(c *gin.Context) {
	req := &ListUserGuildsRequest{}
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

	out, err := r.iLogic.ListUserGuilds(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *guildServiceRouter) ListGuildMembers_0(c *gin.Context) {
	req := &ListGuildMembersRequest{}
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

	out, err := r.iLogic.ListGuildMembers(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *guildServiceRouter) AddGuildMember_0(c *gin.Context) {
	req := &AddGuildMemberRequest{}
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

	out, err := r.iLogic.AddGuildMember(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *guildServiceRouter) RemoveGuildMember_0(c *gin.Context) {
	req := &RemoveGuildMemberRequest{}
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

	out, err := r.iLogic.RemoveGuildMember(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *guildServiceRouter) UpdateGuildMember_0(c *gin.Context) {
	req := &UpdateGuildMemberRequest{}
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

	out, err := r.iLogic.UpdateGuildMember(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}

func (r *guildServiceRouter) GetGuildMember_0(c *gin.Context) {
	req := &GetGuildMemberRequest{}
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

	out, err := r.iLogic.GetGuildMember(ctx, req)
	if err != nil {
		if errors.Is(err, errcode.SkipResponse) {
			return
		}
		r.iResponse.Error(c, err)
		return
	}

	r.iResponse.Success(c, out)
}
