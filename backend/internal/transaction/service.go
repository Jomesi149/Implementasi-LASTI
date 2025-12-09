package transaction

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

type ServiceDeps struct {
	Repo Repository
}

func NewService(d ServiceDeps) *Service {
	return &Service{repo: d.Repo}
}

// CreateWallet registers a new wallet for a user.
func (s *Service) CreateWallet(ctx context.Context, userID uuid.UUID, kind, name, initialBalance string) (*Wallet, error) {
	w := Wallet{ID: uuid.New(), UserID: userID, Type: kind, Name: name, Balance: initialBalance, CreatedAt: time.Now()}
	if err := s.repo.CreateWallet(ctx, w); err != nil {
		return nil, fmt.Errorf("create wallet: %w", err)
	}
	return &w, nil
}

func (s *Service) ListWallets(ctx context.Context, userID uuid.UUID) ([]Wallet, error) {
	return s.repo.ListWallets(ctx, userID)
}

func (s *Service) CreateCategory(ctx context.Context, userID uuid.UUID, name, kind string) (*Category, error) {
	c := Category{ID: uuid.New(), UserID: userID, Name: name, Kind: kind, CreatedAt: time.Now()}
	if err := s.repo.CreateCategory(ctx, c); err != nil {
		return nil, fmt.Errorf("create category: %w", err)
	}
	return &c, nil
}

func (s *Service) ListCategories(ctx context.Context, userID uuid.UUID) ([]Category, error) {
	return s.repo.ListCategories(ctx, userID)
}

func (s *Service) CreateTransaction(ctx context.Context, userID uuid.UUID, walletID uuid.UUID, categoryID *uuid.UUID, amount string, kind string, note *string, occurredAt time.Time) (*Transaction, error) {
	t := Transaction{ID: uuid.New(), UserID: userID, WalletID: walletID, CategoryID: categoryID, Amount: amount, Kind: kind, Note: note, OccurredAt: occurredAt, CreatedAt: time.Now()}
	if err := s.repo.CreateTransaction(ctx, t); err != nil {
		return nil, fmt.Errorf("create transaction: %w", err)
	}
	return &t, nil
}

func (s *Service) ListTransactions(ctx context.Context, userID uuid.UUID, limit int) ([]Transaction, error) {
	return s.repo.ListTransactions(ctx, userID, limit)
}
