package token

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Manager handles issuing JWT access and refresh tokens.
type Manager struct {
	secret          []byte
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
}

// Tokens bundles the generated token strings and expiry metadata.
type Tokens struct {
	AccessToken       string
	RefreshToken      string
	AccessExpiresAt   time.Time
	RefreshExpiresAt  time.Time
}

// NewManager configures a Manager with TTLs.
func NewManager(secret string, accessTTL, refreshTTL time.Duration) *Manager {
	return &Manager{
		secret:          []byte(secret),
		accessTokenTTL:  accessTTL,
		refreshTokenTTL: refreshTTL,
	}
}

// IssueTokens mints signed JWT access and refresh tokens for a subject.
func (m *Manager) IssueTokens(subject string, roles []string, username string, email string) (*Tokens, error) {
	if len(roles) == 0 {
		roles = []string{"user"}
	}

	now := time.Now()
	accessExp := now.Add(m.accessTokenTTL)
	refreshExp := now.Add(m.refreshTokenTTL)

	accessClaims := jwt.MapClaims{
		"sub":      subject,
		"username": username,
		"email":    email,
		"roles":    roles,
		"exp":      accessExp.Unix(),
		"iat":      now.Unix(),
	}
	refreshClaims := jwt.MapClaims{
		"sub":  subject,
		"type": "refresh",
		"exp":  refreshExp.Unix(),
		"iat":  now.Unix(),
	}

	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(m.secret)
	if err != nil {
		return nil, fmt.Errorf("sign access token: %w", err)
	}

	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(m.secret)
	if err != nil {
		return nil, fmt.Errorf("sign refresh token: %w", err)
	}

	return &Tokens{
		AccessToken:      accessToken,
		RefreshToken:     refreshToken,
		AccessExpiresAt:  accessExp,
		RefreshExpiresAt: refreshExp,
	}, nil
}

// HashRefreshToken creates a deterministic hash for storing refresh tokens at rest.
func HashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
