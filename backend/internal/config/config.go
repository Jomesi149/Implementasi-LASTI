package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config keeps runtime configuration values injected via environment variables.
type Config struct {
	AppEnv          string
	HTTPPort        string
	DatabaseURL     string
	JWTSecret       string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
	OTPLifetime     time.Duration
}

// MustLoad loads configuration from the environment or panics when required values are missing.
func MustLoad() Config {
	cfg, err := Load()
	if err != nil {
		panic(err)
	}
	return cfg
}

// Load attempts to load a .env file and then reads the required environment variables.
func Load() (Config, error) {
	_ = godotenv.Load()

	cfg := Config{
		AppEnv:      getEnv("APP_ENV", "development"),
		HTTPPort:    getEnv("HTTP_PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}

	if cfg.JWTSecret == "" {
		return Config{}, fmt.Errorf("JWT_SECRET is required")
	}

	cfg.AccessTokenTTL = parseDurationOrDefault("ACCESS_TOKEN_TTL", 15*time.Minute)
	cfg.RefreshTokenTTL = parseDurationOrDefault("REFRESH_TOKEN_TTL", 7*24*time.Hour)
	cfg.OTPLifetime = parseDurationOrDefault("OTP_WINDOW_SECONDS", 5*time.Minute)

	return cfg, nil
}

func parseDurationOrDefault(env string, fallback time.Duration) time.Duration {
	value := os.Getenv(env)
	if value == "" {
		return fallback
	}

	// Support expressing OTP lifetime as seconds even if caller passes an int.
	if seconds, err := strconv.Atoi(value); err == nil && seconds > 0 {
		return time.Duration(seconds) * time.Second
	}

	dur, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return dur
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
