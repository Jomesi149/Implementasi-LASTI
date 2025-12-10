package account

import (
	"time"

	"github.com/google/uuid"
)

// User represents persisted identity row.
type User struct {
	ID              uuid.UUID
	Email           string
	PhoneNumber     *string
	PasswordHash    string
	IsEmailVerified bool
	IsPhoneVerified bool
	OTPEndpoint     string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// RegisterRequest carries the payload to create a new account.
type RegisterRequest struct {
	Email       string `json:"email" validate:"required,email"`
	PhoneNumber string `json:"phoneNumber" validate:"omitempty,e164"`
	Password    string `json:"password" validate:"required,min=8"`
	Channel     string `json:"channel" validate:"required,oneof=email sms auth_app"`
}

// RegisterResponse returns the created user id and optional debug OTP.
type RegisterResponse struct {
	UserID   uuid.UUID `json:"userId"`
	Message  string    `json:"message"`
	OTPDebug string    `json:"otpDebug,omitempty"`
}

// LoginRequest captures credentials.
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse conveys the OTP dispatch result.
type LoginResponse struct {
	Message      string `json:"message"`
	OTPDebug     string `json:"otpDebug,omitempty"`
	AccessToken  string `json:"accessToken,omitempty"`
	RefreshToken string `json:"refreshToken,omitempty"`
	ExpiresIn    int64  `json:"expiresIn,omitempty"`
}

// VerifyOTPRequest is sent after the user receives an OTP code.
type VerifyOTPRequest struct {
	Email string `json:"email" validate:"required,email"`
	Code  string `json:"code" validate:"required,len=6"`
}

// AuthResponse contains the issued tokens for the caller session.
type AuthResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int64  `json:"expiresIn"`
}

// OTPRecord persists generated OTPs.
type OTPRecord struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	CodeHash  string
	Channel   string
	ExpiresAt time.Time
}

// AuthTokenRecord persists refresh token metadata.
type AuthTokenRecord struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash string
	TokenType string
	ExpiresAt time.Time
	Metadata  string
}
