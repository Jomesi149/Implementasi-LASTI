package otp

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
)

// Payload represents a generated OTP value with metadata.
type Payload struct {
	Code      string
	Hash      string
	ExpiresAt time.Time
}

// Provider generates OTP codes with a shared TTL.
type Provider struct {
	tl time.Duration
}

// NewProvider builds a Provider with the supplied TTL.
func NewProvider(ttl time.Duration) *Provider {
	if ttl <= 0 {
		tl = 5 * time.Minute
	}
	return &Provider{ttl: ttl}
}

// Generate creates a short numeric code and its hashed representation.
func (p *Provider) Generate(_ uuid.UUID) (*Payload, error) {
	const digits = 6
	max := big.NewInt(1)
	max.Exp(big.NewInt(10), big.NewInt(digits), nil)

	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return nil, fmt.Errorf("generate otp: %w", err)
	}

	code := fmt.Sprintf("%06d", n.Int64())

	return &Payload{
		Code:      code,
		Hash:      HashCode(code),
		ExpiresAt: time.Now().Add(p.ttl),
	}, nil
}

// HashCode deterministically hashes the OTP code to avoid storing plaintext.
func HashCode(code string) string {
	sum := sha256.Sum256([]byte(code))
	return hex.EncodeToString(sum[:])
}
