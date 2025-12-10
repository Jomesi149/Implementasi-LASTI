package budget

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/google/uuid"
)

type Repository interface {
	UpsertBudget(ctx context.Context, b Budget) error
	ListBudgets(ctx context.Context, userID uuid.UUID) ([]Budget, error)
}

type SQLRepository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *SQLRepository {
	return &SQLRepository{db: db}
}

func (r *SQLRepository) UpsertBudget(ctx context.Context, b Budget) error {
	query := `
		INSERT INTO finance.budgets (id, user_id, category_id, amount, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		ON CONFLICT (user_id, category_id) 
		DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
	`
	_, err := r.db.ExecContext(ctx, query, b.ID, b.UserID, b.CategoryID, b.Amount)
	if err != nil {
		return fmt.Errorf("upsert budget: %w", err)
	}
	return nil
}

func (r *SQLRepository) ListBudgets(ctx context.Context, userID uuid.UUID) ([]Budget, error) {
	query := `
		SELECT 
			b.id, 
			b.category_id, 
			c.name, 
			b.amount,
			COALESCE(SUM(t.amount), 0) as spent,
			b.created_at
		FROM finance.budgets b
		JOIN finance.categories c ON b.category_id = c.id
		LEFT JOIN finance.transactions t ON t.category_id = b.category_id 
			AND t.user_id = b.user_id
			AND t.kind = 'out'
			AND date_trunc('month', t.occurred_at) = date_trunc('month', CURRENT_DATE)
		WHERE b.user_id = $1
		GROUP BY b.id, c.name
		ORDER BY c.name ASC
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var budgets []Budget
	for rows.Next() {
		var b Budget
		if err := rows.Scan(&b.ID, &b.CategoryID, &b.CategoryName, &b.Amount, &b.Spent, &b.CreatedAt); err != nil {
			return nil, err
		}
		b.UserID = userID
		budgets = append(budgets, b)
	}
	return budgets, nil
}