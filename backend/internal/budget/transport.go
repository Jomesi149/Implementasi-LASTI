package budget

import (
	"encoding/json"
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
	r.Route("/budgets", func(r chi.Router) {
		r.Post("/", h.handleSetBudget)
		r.Get("/", h.handleListBudgets)
	})
}

func (h *HTTPHandler) handleSetBudget(w http.ResponseWriter, r *http.Request) {
	uidStr := r.Header.Get("X-User-ID")
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "invalid user id")
		return
	}

	var req SetBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid payload")
		return
	}

	if err := h.service.SetBudget(r.Context(), uid, req.CategoryID, req.Amount); err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"status": "budget set"})
}

func (h *HTTPHandler) handleListBudgets(w http.ResponseWriter, r *http.Request) {
	uidStr := r.Header.Get("X-User-ID")
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "invalid user id")
		return
	}

	budgets, err := h.service.GetBudgets(r.Context(), uid)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, budgets)
}