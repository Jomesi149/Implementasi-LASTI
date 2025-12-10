package analytics

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/google/uuid"
)

type Repository interface {
	GetExpenseByCategory(ctx context.Context, userID uuid.UUID) ([]CategoryBreakdown, error)
	GetMonthlySummary(ctx context.Context, userID uuid.UUID) ([]MonthlySummary, error)
}

type SQLRepository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *SQLRepository {
	return &SQLRepository{db: db}
}

// GetExpenseByCategory: Menghitung total pengeluaran per kategori
func (r *SQLRepository) GetExpenseByCategory(ctx context.Context, userID uuid.UUID) ([]CategoryBreakdown, error) {
	query := `
		SELECT c.name, SUM(t.amount) as total
		FROM finance.transactions t
		JOIN finance.categories c ON t.category_id = c.id
		WHERE t.user_id = $1 AND t.kind = 'out'
		GROUP BY c.name
		ORDER BY total DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("query breakdown: %w", err)
	}
	defer rows.Close()

	var data []CategoryBreakdown
	for rows.Next() {
		var d CategoryBreakdown
		if err := rows.Scan(&d.CategoryName, &d.TotalAmount); err != nil {
			return nil, err
		}
		data = append(data, d)
	}
	return data, nil
}

// GetMonthlySummary: Rekap Pemasukan vs Pengeluaran 6 bulan terakhir
func (r *SQLRepository) GetMonthlySummary(ctx context.Context, userID uuid.UUID) ([]MonthlySummary, error) {
	query := `
		SELECT 
			TO_CHAR(occurred_at, 'Mon YYYY') as month_label,
			SUM(CASE WHEN kind = 'in' THEN amount ELSE 0 END) as income,
			SUM(CASE WHEN kind = 'out' THEN amount ELSE 0 END) as expense
		FROM finance.transactions
		WHERE user_id = $1
		GROUP BY TO_CHAR(occurred_at, 'Mon YYYY'), date_trunc('month', occurred_at)
		ORDER BY date_trunc('month', occurred_at) ASC
		LIMIT 6
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("query monthly: %w", err)
	}
	defer rows.Close()

	var data []MonthlySummary
	for rows.Next() {
		var d MonthlySummary
		if err := rows.Scan(&d.Month, &d.Income, &d.Expense); err != nil {
			return nil, err
		}
		data = append(data, d)
	}
	return data, nil
}