package analytics

import (
	"context"
	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// GetDashboardData memanggil kedua repository dan menggabungkannya
func (s *Service) GetDashboardData(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	breakdown, err := s.repo.GetExpenseByCategory(ctx, userID)
	if err != nil {
		return nil, err
	}
	
	monthly, err := s.repo.GetMonthlySummary(ctx, userID)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"breakdown": breakdown,
		"monthly":   monthly,
	}, nil
}