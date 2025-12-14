package budget

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"

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
	// Parse amount string to float64 for database storage
	amount, err := strconv.ParseFloat(b.Amount, 64)
	if err != nil {
		fmt.Printf("[BUDGET_UPSERT_ERROR] Invalid amount format: %s, error: %v\n", b.Amount, err)
		return fmt.Errorf("invalid amount format: %w", err)
	}

	query := `
		INSERT INTO finance.budgets (id, user_id, category_id, amount, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		ON CONFLICT (user_id, category_id) 
		DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
	`
	fmt.Printf("[BUDGET_UPSERT] Attempting to upsert budget: ID=%s, UserID=%s, CategoryID=%s, Amount=%f\n",
		b.ID, b.UserID, b.CategoryID, amount)
	_, err = r.db.ExecContext(ctx, query, b.ID, b.UserID, b.CategoryID, amount)
	if err != nil {
		fmt.Printf("[BUDGET_UPSERT_ERROR] %v\n", err)
		return fmt.Errorf("upsert budget: %w", err)
	}
	fmt.Printf("[BUDGET_UPSERT_SUCCESS] Budget saved successfully\n")
	return nil
}

func (r *SQLRepository) ListBudgets(ctx context.Context, userID uuid.UUID) ([]Budget, error) {
	query := `
		SELECT 
			b.id, 
			b.category_id, 
			c.name, 
			b.amount::TEXT,
			COALESCE(SUM(t.amount), 0)::TEXT as spent,
			b.created_at
		FROM finance.budgets b
		JOIN finance.categories c ON b.category_id = c.id
		LEFT JOIN finance.transactions t ON t.category_id = b.category_id 
			AND t.user_id = b.user_id
			AND t.kind = 'out'
			AND date_trunc('month', t.occurred_at) = date_trunc('month', CURRENT_DATE)
		WHERE b.user_id = $1
		GROUP BY b.id, b.category_id, c.name, b.amount, b.created_at
		ORDER BY c.name ASC
	`

	fmt.Printf("[BUDGET_LIST] Running query for user: %s\n", userID)
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		fmt.Printf("[BUDGET_LIST_ERROR] Query error: %v\n", err)
		return nil, err
	}
	defer rows.Close()

	var budgets []Budget
	for rows.Next() {
		var b Budget
		if err := rows.Scan(&b.ID, &b.CategoryID, &b.CategoryName, &b.Amount, &b.Spent, &b.CreatedAt); err != nil {
			fmt.Printf("[BUDGET_LIST_ERROR] Scan error: %v\n", err)
			return nil, err
		}
		b.UserID = userID
		budgets = append(budgets, b)
	}
	fmt.Printf("[BUDGET_LIST_SUCCESS] Found %d budgets\n", len(budgets))
	return budgets, nil
}
