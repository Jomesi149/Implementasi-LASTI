package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-playground/validator/v10"

	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/account"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/config"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/database"
	httpapi "github.com/Jomesi149/Implementasi-LASTI/backend/internal/http"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/otp"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/security"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/server"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/token"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/transaction"
)

func main() {
	cfg := config.MustLoad()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}
	defer db.Close()

	validate := validator.New()
	passwordHasher := security.NewBcryptHasher(12)
	otpProvider := otp.NewProvider(cfg.OTPLifetime)
	tokenManager := token.NewManager(cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)

	// account
	repo := account.NewRepository(db)
	service := account.NewService(account.ServiceDeps{
		Repo:           repo,
		Validator:      validate,
		PasswordHasher: passwordHasher,
		OTPProvider:    otpProvider,
		TokenManager:   tokenManager,
		AppEnv:         cfg.AppEnv,
	})

	handler := account.NewHTTPHandler(service)

	// transactions
	transRepo := transaction.NewRepository(db)
	transService := transaction.NewService(transaction.ServiceDeps{Repo: transRepo})
	transHandler := transaction.NewHTTPHandler(transService)

	router := httpapi.NewRouter(handler, transHandler)

	srv := server.New(cfg.HTTPPort, router)

	go func() {
		if err := srv.Start(); err != nil {
			log.Printf("http server stopped: %v", err)
			stop()
		}
	}()

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Stop(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}
