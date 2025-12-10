package analytics

import (
	"net/http"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/Jomesi149/Implementasi-LASTI/backend/pkg/response"
)

type HTTPHandler struct {
	service *Service
}

func NewHTTPHandler(s *Service) *HTTPHandler {
	return &HTTPHandler{service: s}
}

func (h *HTTPHandler) RegisterRoutes(r chi.Router) {
	r.Get("/analytics", h.handleGetAnalytics)
}

func (h *HTTPHandler) handleGetAnalytics(w http.ResponseWriter, r *http.Request) {
	uidStr := r.Header.Get("X-User-ID")
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "invalid user id")
		return
	}

	data, err := h.service.GetDashboardData(r.Context(), uid)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, data)
}