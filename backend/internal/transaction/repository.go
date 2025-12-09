package transaction

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
)

// Repository defines persistence operations for finance domain.
type Repository interface {
	CreateWallet(ctx context.Context, w Wallet) error
	ListWallets(ctx context.Context, userID uuid.UUID) ([]Wallet, error)
	CreateCategory(ctx context.Context, c Category) error
	ListCategories(ctx context.Context, userID uuid.UUID) ([]Category, error)
	CreateTransaction(ctx context.Context, t Transaction) error
	ListTransactions(ctx context.Context, userID uuid.UUID, limit int) ([]Transaction, error)
}

// SQLRepository implements Repository using PostgreSQL.
type SQLRepository struct {
	db *sql.DB
}

// NewRepository constructs a SQL repository.
func NewRepository(db *sql.DB) *SQLRepository {
	return &SQLRepository{db: db}
}

func (r *SQLRepository) CreateWallet(ctx context.Context, w Wallet) error {
	query := `INSERT INTO finance.wallets (id, user_id, type, name, balance, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`
	if _, err := r.db.ExecContext(ctx, query, w.ID, w.UserID, w.Type, w.Name, w.Balance); err != nil {
		return fmt.Errorf("insert wallet: %w", err)
	}
	return nil
}

func (r *SQLRepository) ListWallets(ctx context.Context, userID uuid.UUID) ([]Wallet, error) {
	query := `SELECT id, user_id, type, name, balance, created_at FROM finance.wallets WHERE user_id = $1`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Wallet
	for rows.Next() {
		var w Wallet
		if err := rows.Scan(&w.ID, &w.UserID, &w.Type, &w.Name, &w.Balance, &w.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, w)
	}
	return out, nil
}

func (r *SQLRepository) CreateCategory(ctx context.Context, c Category) error {
	query := `INSERT INTO finance.categories (id, user_id, name, kind, created_at) VALUES ($1,$2,$3,$4,NOW())`
	if _, err := r.db.ExecContext(ctx, query, c.ID, c.UserID, c.Name, c.Kind); err != nil {
		return fmt.Errorf("insert category: %w", err)
	}
	return nil
}

func (r *SQLRepository) ListCategories(ctx context.Context, userID uuid.UUID) ([]Category, error) {
	query := `SELECT id, user_id, name, kind, created_at FROM finance.categories WHERE user_id = $1`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Category
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.UserID, &c.Name, &c.Kind, &c.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, nil
}

// CreateTransaction inserts a transaction and updates wallet balance atomically.
func (r *SQLRepository) CreateTransaction(ctx context.Context, t Transaction) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	q := `INSERT INTO finance.transactions (id, user_id, wallet_id, category_id, amount, kind, note, occurred_at, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`
	if _, err = tx.ExecContext(ctx, q, t.ID, t.UserID, t.WalletID, t.CategoryID, t.Amount, t.Kind, t.Note, t.OccurredAt); err != nil {
		return fmt.Errorf("insert transaction: %w", err)
	}

	// Update wallet balance
	var balanceOp string
	if t.Kind == "in" {
		balanceOp = "balance + $1"
	} else {
		balanceOp = "balance - $1"
	}
	uq := fmt.Sprintf("UPDATE finance.wallets SET balance = %s, updated_at = NOW() WHERE id = $2", balanceOp)
	if _, err = tx.ExecContext(ctx, uq, t.Amount, t.WalletID); err != nil {
		return fmt.Errorf("update wallet: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}

func (r *SQLRepository) ListTransactions(ctx context.Context, userID uuid.UUID, limit int) ([]Transaction, error) {
	if limit <= 0 {
		limit = 50
	}
	query := `SELECT id, user_id, wallet_id, category_id, amount, kind, note, occurred_at, created_at FROM finance.transactions WHERE user_id = $1 ORDER BY occurred_at DESC LIMIT $2`
	rows, err := r.db.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Transaction
	for rows.Next() {
		var t Transaction
		var note sql.NullString
		var catID sql.NullString

		if err := rows.Scan(&t.ID, &t.UserID, &t.WalletID, &catID, &t.Amount, &t.Kind, &note, &t.OccurredAt, &t.CreatedAt); err != nil {
			return nil, err
		}
		if catID.Valid {
			id, _ := uuid.Parse(catID.String)
			t.CategoryID = &id
		}
		if note.Valid {
			s := note.String
			t.Note = &s
		}
		out = append(out, t)
	}
	return out, nil
}
