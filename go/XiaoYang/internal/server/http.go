package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/zhufuyi/sponge/pkg/app"

	"XiaoYang/internal/routers"
)

var _ app.IServer = (*httpServer)(nil)

type httpServer struct {
	addr   string
	server *http.Server
}

// Start http service
func (s *httpServer) Start() error {
	if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("listen server error: %v", err)
	}
	return nil
}

// Stop http service
func (s *httpServer) Stop() error {
	ctx, _ := context.WithTimeout(context.Background(), 3*time.Second) //nolint
	return s.server.Shutdown(ctx)
}

// String comment
func (s *httpServer) String() string {
	return "http service address " + s.addr
}

// NewHTTPServer creates a new http server
func NewHTTPServer(addr string, opts ...HTTPOption) app.IServer {
	o := defaultHTTPOptions()
	o.apply(opts...)

	if o.isProd {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	router := routers.NewRouter()
	server := &http.Server{
		Addr:           addr,
		Handler:        router,
		MaxHeaderBytes: 1 << 20,
	}

	return &httpServer{
		addr:   addr,
		server: server,
	}
}
