package account

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"

	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/otp"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/security"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/token"
	"github.com/Jomesi149/Implementasi-LASTI/backend/internal/transaction"
)

var (
	// ErrInvalidCredentials is returned when email/password do not match.
	ErrInvalidCredentials = errors.New("invalid_credentials")
	// ErrOTPNotFound indicates the supplied OTP is unknown or expired.
	ErrOTPNotFound = errors.New("otp_not_found")
)

// Service orchestrates the account flows.
type Service struct {
	repo            Repository
	transactionRepo transaction.Repository
	validator       *validator.Validate
	passwordHasher  security.PasswordHasher
	otpProvider     *otp.Provider
	tokenManager    *token.Manager
	appEnv          string
}

// ServiceDeps contains Service constructor dependencies.
type ServiceDeps struct {
	Repo            Repository
	TransactionRepo transaction.Repository
	Validator       *validator.Validate
	PasswordHasher  security.PasswordHasher
	OTPProvider     *otp.Provider
	TokenManager    *token.Manager
	AppEnv          string
}

// NewService wires the account service.
func NewService(deps ServiceDeps) *Service {
	return &Service{
		repo:            deps.Repo,
		transactionRepo: deps.TransactionRepo,
		validator:       deps.Validator,
		passwordHasher:  deps.PasswordHasher,
		otpProvider:     deps.OTPProvider,
		tokenManager:    deps.TokenManager,
		appEnv:          deps.AppEnv,
	}
}

// Register creates a new user and issues an OTP for verification.
func (s *Service) Register(ctx context.Context, req RegisterRequest) (*RegisterResponse, error) {
	if err := s.validator.StructCtx(ctx, req); err != nil {
		return nil, fmt.Errorf("invalid payload: %w", err)
	}

	if _, err := s.repo.GetUserByEmail(ctx, strings.ToLower(req.Email)); err == nil {
		return nil, fmt.Errorf("email already registered")
	} else if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	hash, err := s.passwordHasher.Hash(req.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	userID := uuid.New()
	var phone *string
	if req.PhoneNumber != "" {
		phone = &req.PhoneNumber
	}

	user := &User{
		ID:              userID,
		Email:           strings.ToLower(req.Email),
		Username:        req.Username,
		PhoneNumber:     phone,
		PasswordHash:    hash,
		IsEmailVerified: false,
		IsPhoneVerified: false,
	}

	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, err
	}

	// Create default wallet for new user (1 user = 1 wallet)
	wallet := transaction.Wallet{
		ID:      uuid.New(),
		UserID:  userID,
		Type:    "cash",
		Name:    "Dompet Utama",
		Balance: "0",
	}
	fmt.Printf("\n[WALLET_CREATE] Attempting to create wallet for user %s\n", userID.String())
	if err := s.transactionRepo.CreateWallet(ctx, wallet); err != nil {
		fmt.Printf("[WALLET_ERROR] Failed to create wallet for user %s: %v\n", userID.String(), err)
	} else {
		fmt.Printf("[WALLET_SUCCESS] Created wallet %s for user %s\n", wallet.ID.String(), userID.String())
	}

	otpPayload, err := s.otpProvider.Generate(userID)
	if err != nil {
		return nil, fmt.Errorf("generate otp: %w", err)
	}

	record := OTPRecord{
		ID:        uuid.New(),
		UserID:    userID,
		CodeHash:  otpPayload.Hash,
		Channel:   req.Channel,
		ExpiresAt: otpPayload.ExpiresAt,
	}

	if err := s.repo.StoreOTP(ctx, record); err != nil {
		return nil, err
	}

	resp := &RegisterResponse{
		UserID:  userID,
		Message: "OTP dispatched",
	}

	if s.appEnv != "production" {
		resp.OTPDebug = otpPayload.Code
	}

	return resp, nil
}

// Login validates credentials and triggers an OTP challenge.
func (s *Service) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	if err := s.validator.StructCtx(ctx, req); err != nil {
		return nil, fmt.Errorf("invalid payload: %w", err)
	}

	user, err := s.repo.GetUserByEmail(ctx, strings.ToLower(req.Email))
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := s.passwordHasher.Compare(user.PasswordHash, req.Password); err != nil {
		return nil, ErrInvalidCredentials
	}

	// Langsung issue tokens tanpa OTP
	tokens, err := s.tokenManager.IssueTokens(user.ID.String(), []string{"user"}, user.Username, user.Email)
	if err != nil {
		return nil, fmt.Errorf("issue tokens: %w", err)
	}

	authRecord := AuthTokenRecord{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenType: "refresh",
		TokenHash: token.HashRefreshToken(tokens.RefreshToken),
		ExpiresAt: tokens.RefreshExpiresAt,
		Metadata:  `{"reason":"direct_login"}`,
	}

	if err := s.repo.SaveRefreshToken(ctx, authRecord); err != nil {
		return nil, err
	}

	resp := &LoginResponse{
		Message:      "Login successful",
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresIn:    int64(tokens.AccessExpiresAt.Sub(time.Now()).Seconds()),
	}
	return resp, nil
}

// VerifyOTP validates the code and issues JWT tokens.
func (s *Service) VerifyOTP(ctx context.Context, req VerifyOTPRequest) (*AuthResponse, error) {
	if err := s.validator.StructCtx(ctx, req); err != nil {
		return nil, fmt.Errorf("invalid payload: %w", err)
	}

	user, err := s.repo.GetUserByEmail(ctx, strings.ToLower(req.Email))
	if err != nil {
		return nil, ErrOTPNotFound
	}

	hash := otp.HashCode(req.Code)
	otpRecord, err := s.repo.FindOTP(ctx, user.ID, hash, time.Now())
	if err != nil {
		return nil, ErrOTPNotFound
	}

	if err := s.repo.ConsumeOTP(ctx, otpRecord.ID, time.Now()); err != nil {
		return nil, err
	}

	if err := s.repo.MarkEmailVerified(ctx, user.ID, time.Now()); err != nil {
		return nil, err
	}

	tokens, err := s.tokenManager.IssueTokens(user.ID.String(), []string{"user"}, user.Username, user.Email)
	if err != nil {
		return nil, err
	}

	authRecord := AuthTokenRecord{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenType: "refresh",
		TokenHash: token.HashRefreshToken(tokens.RefreshToken),
		ExpiresAt: tokens.RefreshExpiresAt,
		Metadata:  `{"reason":"otp_verified"}`,
	}

	if err := s.repo.SaveRefreshToken(ctx, authRecord); err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresIn:    int64(tokens.AccessExpiresAt.Sub(time.Now()).Seconds()),
	}, nil
}
