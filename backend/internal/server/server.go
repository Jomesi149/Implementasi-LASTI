package server

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

// Server represents the HTTP server lifecycle management helper.
type Server struct {
	httpServer *http.Server
}

// New builds a new HTTP server bound to the supplied port.
func New(port string, handler http.Handler) *Server {
	if port == "" {
		port = "8080"
	}

	return &Server{
		httpServer: &http.Server{
			Addr:              fmt.Sprintf(":%s", port),
			Handler:           handler,
			ReadHeaderTimeout: 10 * time.Second,
			ReadTimeout:       30 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       60 * time.Second,
		},
	}
}

// Start blocks the current goroutine until the server stops or fails.
func (s *Server) Start() error {
	return s.httpServer.ListenAndServe()
}

// Stop gracefully shuts down the HTTP server.
func (s *Server) Stop(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}
