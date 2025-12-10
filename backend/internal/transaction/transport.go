package transaction

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/Jomesi149/Implementasi-LASTI/backend/pkg/response"
)

// HTTPHandler exposes transaction endpoints.
type HTTPHandler struct {
	service *Service
}

func NewHTTPHandler(s *Service) *HTTPHandler {
	return &HTTPHandler{service: s}
}

func (h *HTTPHandler) RegisterRoutes(r chi.Router) {
	r.Route("/wallets", func(r chi.Router) {
		r.Post("/", h.handleCreateWallet)
		r.Get("/", h.handleListWallets)
	})
	r.Route("/categories", func(r chi.Router) {
		r.Post("/", h.handleCreateCategory)
		r.Get("/", h.handleListCategories)
	})
	r.Route("/transactions", func(r chi.Router) {
		r.Post("/", h.handleCreateTransaction)
		r.Get("/", h.handleListTransactions)
	})
}

func getUserIDFromHeader(r *http.Request) (uuid.UUID, error) {
	s := r.Header.Get("X-User-ID")
	return uuid.Parse(s)
}

type createWalletReq struct {
	Type    string `json:"type"`
	Name    string `json:"name"`
	Balance string `json:"balance"`
}

func (h *HTTPHandler) handleCreateWallet(w http.ResponseWriter, r *http.Request) {
	uid, err := getUserIDFromHeader(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "missing X-User-ID header")
		return
	}
	var req createWalletReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid payload")
		return
	}
	wallet, err := h.service.CreateWallet(r.Context(), uid, req.Type, req.Name, req.Balance)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, wallet)
}

func (h *HTTPHandler) handleListWallets(w http.ResponseWriter, r *http.Request) {
	uid, err := getUserIDFromHeader(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "missing X-User-ID header")
		return
	}
	fmt.Printf("\n[LIST_WALLETS] Request from user: %s\n", uid.String())
	wallets, err := h.service.ListWallets(r.Context(), uid)
	if err != nil {
		fmt.Printf("[LIST_WALLETS_ERROR] Failed for user %s: %v\n", uid.String(), err)
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	fmt.Printf("[LIST_WALLETS_SUCCESS] Found %d wallet(s) for user %s\n", len(wallets), uid.String())
	response.JSON(w, http.StatusOK, wallets)
}

type createCategoryReq struct {
	Name string `json:"name"`
	Kind string `json:"kind"`
}

func (h *HTTPHandler) handleCreateCategory(w http.ResponseWriter, r *http.Request) {
	uid, err := getUserIDFromHeader(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "missing X-User-ID header")
		return
	}
	var req createCategoryReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid payload")
		return
	}
	cat, err := h.service.CreateCategory(r.Context(), uid, req.Name, req.Kind)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, cat)
}

func (h *HTTPHandler) handleListCategories(w http.ResponseWriter, r *http.Request) {
	uid, err := getUserIDFromHeader(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "missing X-User-ID header")
		return
	}
	categories, err := h.service.ListCategories(r.Context(), uid)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, categories)
}

type createTransactionReq struct {
	WalletID   string     `json:"wallet_id"`
	CategoryID *string    `json:"category_id"`
	Amount     string     `json:"amount"`
	Kind       string     `json:"kind"`
	Note       *string    `json:"note"`
	OccurredAt *time.Time `json:"occurred_at"`
}

func (h *HTTPHandler) handleCreateTransaction(w http.ResponseWriter, r *http.Request) {
	uid, err := getUserIDFromHeader(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "missing X-User-ID header")
		return
	}
	var req createTransactionReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid payload")
		return
	}
	wid, err := uuid.Parse(req.WalletID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid wallet id")
		return
	}
	var cid *uuid.UUID
	if req.CategoryID != nil {
		id, err := uuid.Parse(*req.CategoryID)
		if err == nil {
			cid = &id
		}
	}
	occ := time.Now()
	if req.OccurredAt != nil {
		occ = *req.OccurredAt
	}
	t, err := h.service.CreateTransaction(r.Context(), uid, wid, cid, req.Amount, req.Kind, req.Note, occ)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, t)
}

func (h *HTTPHandler) handleListTransactions(w http.ResponseWriter, r *http.Request) {
	uid, err := getUserIDFromHeader(r)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "missing X-User-ID header")
		return
	}
	q := r.URL.Query().Get("limit")
	limit := 50
	if q != "" {
		if v, err := strconv.Atoi(q); err == nil {
			limit = v
		}
	}
	list, err := h.service.ListTransactions(r.Context(), uid, limit)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, list)
}
