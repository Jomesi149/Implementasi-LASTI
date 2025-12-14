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
		SELECT c.name, COALESCE(SUM(t.amount), 0)::TEXT as total
		FROM finance.transactions t
		JOIN finance.categories c ON t.category_id = c.id
		WHERE t.user_id = $1 AND t.kind = 'out'
		GROUP BY c.name
		ORDER BY SUM(t.amount) DESC
	`
	fmt.Printf("[ANALYTICS] GetExpenseByCategory for user: %s\n", userID)
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		fmt.Printf("[ANALYTICS_ERROR] query breakdown: %v\n", err)
		return nil, fmt.Errorf("query breakdown: %w", err)
	}
	defer rows.Close()

	var data []CategoryBreakdown
	for rows.Next() {
		var d CategoryBreakdown
		if err := rows.Scan(&d.CategoryName, &d.TotalAmount); err != nil {
			fmt.Printf("[ANALYTICS_ERROR] scan error: %v\n", err)
			return nil, err
		}
		fmt.Printf("[ANALYTICS] Category: %s, Amount: %s\n", d.CategoryName, d.TotalAmount)
		data = append(data, d)
	}
	fmt.Printf("[ANALYTICS] Found %d expense categories\n", len(data))
	return data, nil
}

// GetMonthlySummary: Rekap Pemasukan vs Pengeluaran 6 bulan terakhir
func (r *SQLRepository) GetMonthlySummary(ctx context.Context, userID uuid.UUID) ([]MonthlySummary, error) {
	query := `
		SELECT 
			TO_CHAR(occurred_at, 'Mon YYYY') as month_label,
			COALESCE(SUM(CASE WHEN kind = 'in' THEN amount ELSE 0 END), 0)::TEXT as income,
			COALESCE(SUM(CASE WHEN kind = 'out' THEN amount ELSE 0 END), 0)::TEXT as expense
		FROM finance.transactions
		WHERE user_id = $1
		GROUP BY TO_CHAR(occurred_at, 'Mon YYYY'), date_trunc('month', occurred_at)
		ORDER BY date_trunc('month', occurred_at) ASC
		LIMIT 6
	`
	fmt.Printf("[ANALYTICS] GetMonthlySummary for user: %s\n", userID)
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		fmt.Printf("[ANALYTICS_ERROR] query monthly: %v\n", err)
		return nil, fmt.Errorf("query monthly: %w", err)
	}
	defer rows.Close()

	var data []MonthlySummary
	for rows.Next() {
		var d MonthlySummary
		if err := rows.Scan(&d.Month, &d.Income, &d.Expense); err != nil {
			fmt.Printf("[ANALYTICS_ERROR] scan error: %v\n", err)
			return nil, err
		}
		fmt.Printf("[ANALYTICS] Month: %s, Income: %s, Expense: %s\n", d.Month, d.Income, d.Expense)
		data = append(data, d)
	}
	fmt.Printf("[ANALYTICS] Found %d months of data\n", len(data))
	return data, nil
}
