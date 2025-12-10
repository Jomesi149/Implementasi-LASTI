package httpapi

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/account"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/transaction"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/budget"   
    "github.com/Jomesi149/Implementasi-LASTI/backend/internal/analytics" 
)

// NewRouter wires middlewares and HTTP handlers.
func NewRouter(accountHandler *account.HTTPHandler, transactionHandler *transaction.HTTPHandler, budgetHandler *budget.HTTPHandler, analyticsHandler *analytics.HTTPHandler) http.Handler {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:4000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/api/v1", func(r chi.Router) {
		accountHandler.RegisterRoutes(r)
		transactionHandler.RegisterRoutes(r)
		budgetHandler.RegisterRoutes(r)
		analyticsHandler.RegisterRoutes(r)
	})

	return r
}
