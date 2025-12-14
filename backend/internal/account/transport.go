package account

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/Jomesi149/Implementasi-LASTI/backend/pkg/response"
)

// HTTPHandler exposes account endpoints.
type HTTPHandler struct {
	service *Service
}

// NewHTTPHandler constructs an HTTP handler for account operations.
func NewHTTPHandler(service *Service) *HTTPHandler {
	return &HTTPHandler{service: service}
}

// RegisterRoutes attaches endpoints to the given router.
func (h *HTTPHandler) RegisterRoutes(r chi.Router) {
	r.Route("/account", func(r chi.Router) {
		r.Post("/register", h.handleRegister)
		r.Post("/login", h.handleLogin)
		r.Post("/verify-otp", h.handleVerifyOTP)
	})
}

func (h *HTTPHandler) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid JSON payload")
		return
	}

	// DEBUG: Log received payload
	println("🔍 DEBUG: Register request received")
	println("  Email:", req.Email)
	println("  Username:", req.Username)
	println("  PhoneNumber:", req.PhoneNumber)
	println("  Password:", req.Password)
	println("  Channel:", req.Channel)

	result, err := h.service.Register(r.Context(), req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, result)
}

func (h *HTTPHandler) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid JSON payload")
		return
	}

	result, err := h.service.Login(r.Context(), req)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, ErrInvalidCredentials) {
			status = http.StatusUnauthorized
		}
		response.Error(w, status, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *HTTPHandler) handleVerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req VerifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid JSON payload")
		return
	}

	tokens, err := h.service.VerifyOTP(r.Context(), req)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, ErrOTPNotFound) {
			status = http.StatusUnauthorized
		}
		response.Error(w, status, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, tokens)
}
