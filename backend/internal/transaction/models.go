package transaction

import (
	"time"

	"github.com/google/uuid"
)

type Wallet struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Type      string    `json:"type"`
	Name      string    `json:"name"`
	Balance   string    `json:"balance"`
	CreatedAt time.Time `json:"created_at"`
}

type Category struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Name      string    `json:"name"`
	Kind      string    `json:"kind"`
	CreatedAt time.Time `json:"created_at"`
}

type Transaction struct {
	ID         uuid.UUID  `json:"id"`
	UserID     uuid.UUID  `json:"user_id"`
	WalletID   uuid.UUID  `json:"wallet_id"`
	CategoryID *uuid.UUID `json:"category_id,omitempty"`
	Amount     string     `json:"amount"`
	Kind       string     `json:"kind"`
	Note       *string    `json:"note,omitempty"`
	OccurredAt time.Time  `json:"occurred_at"`
	CreatedAt  time.Time  `json:"created_at"`
}
