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
	fmt.Printf("[BUDGET_LIST] Fetching budgets for user: %s\n", userID.String())
	budgets, err := s.repo.ListBudgets(ctx, userID)
	if err != nil {
		fmt.Printf("[BUDGET_LIST_ERROR] Error fetching budgets: %v\n", err)
		return nil, err
	}
	fmt.Printf("[BUDGET_LIST_SUCCESS] Found %d budgets\n", len(budgets))
	return budgets, nil
}
