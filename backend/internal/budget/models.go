package budget

import (
	"time"
	"github.com/google/uuid"
)

type Budget struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	CategoryID   uuid.UUID `json:"category_id"`
	CategoryName string    `json:"category_name"` 
	Amount       string    `json:"amount"`        
	Spent        string    `json:"spent"`         
	CreatedAt    time.Time `json:"created_at"`
}

// Payload untuk create/update budget
type SetBudgetRequest struct {
	CategoryID string `json:"category_id" validate:"required,uuid"`
	Amount     string `json:"amount" validate:"required,numeric"`
}