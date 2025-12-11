package account

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Repository encapsulates persistence logic for identity data.
type Repository interface {
	CreateUser(ctx context.Context, user *User) error
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	StoreOTP(ctx context.Context, otp OTPRecord) error
	FindOTP(ctx context.Context, userID uuid.UUID, codeHash string, now time.Time) (*OTPRecord, error)
	ConsumeOTP(ctx context.Context, otpID uuid.UUID, consumedAt time.Time) error
	MarkEmailVerified(ctx context.Context, userID uuid.UUID, verifiedAt time.Time) error
	SaveRefreshToken(ctx context.Context, token AuthTokenRecord) error
}

// SQLRepository is a PostgreSQL implementation of Repository.
type SQLRepository struct {
	db *sql.DB
}

// NewRepository creates a SQL-backed repository.
func NewRepository(db *sql.DB) *SQLRepository {
	return &SQLRepository{db: db}
}

// CreateUser inserts a new record into identity.users.
func (r *SQLRepository) CreateUser(ctx context.Context, user *User) error {
	query := `INSERT INTO identity.users (id, email, username, phone_number, password_hash, is_email_verified, is_phone_verified, otp_enabled, created_at, updated_at)
		VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, NOW(), NOW())`

	_, err := r.db.ExecContext(ctx, query,
		user.ID,
		user.Email,
		user.Username,
		valueOrEmpty(user.PhoneNumber),
		user.PasswordHash,
		user.IsEmailVerified,
		user.IsPhoneVerified,
		true,
	)
	if err != nil {
		return fmt.Errorf("insert user: %w", err)
	}
	return nil
}

// GetUserByEmail fetches a user joined with meta columns.
func (r *SQLRepository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	query := `SELECT id, email, username, phone_number, password_hash, is_email_verified, is_phone_verified, created_at, updated_at
		FROM identity.users WHERE email = $1`

	row := r.db.QueryRowContext(ctx, query, email)
	var usr User
	var phone sql.NullString

	if err := row.Scan(&usr.ID, &usr.Email, &usr.Username, &phone, &usr.PasswordHash, &usr.IsEmailVerified, &usr.IsPhoneVerified, &usr.CreatedAt, &usr.UpdatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, err
		}
		return nil, fmt.Errorf("select user: %w", err)
	}

	if phone.Valid {
		usr.PhoneNumber = &phone.String
	}

	return &usr, nil
}

// StoreOTP persists an OTP hash for later validation.
func (r *SQLRepository) StoreOTP(ctx context.Context, otp OTPRecord) error {
	query := `INSERT INTO identity.otp_codes (id, user_id, code_hash, channel, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())`

	_, err := r.db.ExecContext(ctx, query, otp.ID, otp.UserID, otp.CodeHash, otp.Channel, otp.ExpiresAt)
	if err != nil {
		return fmt.Errorf("insert otp: %w", err)
	}
	return nil
}

// FindOTP locates a valid OTP by its hashed value.
func (r *SQLRepository) FindOTP(ctx context.Context, userID uuid.UUID, codeHash string, now time.Time) (*OTPRecord, error) {
	query := `SELECT id, user_id, code_hash, channel, expires_at
		FROM identity.otp_codes
		WHERE user_id = $1 AND code_hash = $2 AND consumed_at IS NULL AND expires_at >= $3
		ORDER BY created_at DESC LIMIT 1`

	row := r.db.QueryRowContext(ctx, query, userID, codeHash, now)
	var record OTPRecord
	if err := row.Scan(&record.ID, &record.UserID, &record.CodeHash, &record.Channel, &record.ExpiresAt); err != nil {
		return nil, err
	}
	return &record, nil
}

// ConsumeOTP tags an OTP as used.
func (r *SQLRepository) ConsumeOTP(ctx context.Context, otpID uuid.UUID, consumedAt time.Time) error {
	query := `UPDATE identity.otp_codes SET consumed_at = $2 WHERE id = $1`
	if _, err := r.db.ExecContext(ctx, query, otpID, consumedAt); err != nil {
		return fmt.Errorf("consume otp: %w", err)
	}
	return nil
}

// MarkEmailVerified flips the verification flags on the user.
func (r *SQLRepository) MarkEmailVerified(ctx context.Context, userID uuid.UUID, verifiedAt time.Time) error {
	query := `UPDATE identity.users SET is_email_verified = TRUE, updated_at = $2 WHERE id = $1`
	if _, err := r.db.ExecContext(ctx, query, userID, verifiedAt); err != nil {
		return fmt.Errorf("mark verified: %w", err)
	}
	return nil
}

// SaveRefreshToken stores hashed refresh tokens for revocation support.
func (r *SQLRepository) SaveRefreshToken(ctx context.Context, token AuthTokenRecord) error {
	query := `INSERT INTO identity.auth_tokens (id, user_id, token_type, token_hash, expires_at, created_at, metadata)
		VALUES ($1, $2, $3, $4, $5, NOW(), $6)`

	_, err := r.db.ExecContext(ctx, query, token.ID, token.UserID, token.TokenType, token.TokenHash, token.ExpiresAt, token.Metadata)
	if err != nil {
		return fmt.Errorf("insert refresh token: %w", err)
	}
	return nil
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
