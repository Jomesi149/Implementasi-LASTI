package budget

import (
	"context"
	"fmt"
	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) SetBudget(ctx context.Context, userID uuid.UUID, categoryIDStr, amount string) error {
	catID, err := uuid.Parse(categoryIDStr)
	if err != nil {
		return fmt.Errorf("invalid category id")
	}

	b := Budget{
		ID:         uuid.New(),
		UserID:     userID,
		CategoryID: catID,
		Amount:     amount,
	}

	return s.repo.UpsertBudget(ctx, b)
}

func (s *Service) GetBudgets(ctx context.Context, userID uuid.UUID) ([]Budget, error) {
	return s.repo.ListBudgets(ctx, userID)
}