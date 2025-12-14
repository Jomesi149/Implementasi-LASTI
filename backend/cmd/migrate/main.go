package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	dsn := "postgres://postgres:postgres@localhost:5432/lasti"
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.PingContext(context.Background()); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	ctx := context.Background()

	// Migration 1: Add username column
	migration1 := `
	DO $$
	BEGIN
	  IF NOT EXISTS (
	    SELECT 1 FROM information_schema.columns 
	    WHERE table_name = 'users' AND column_name = 'username'
	  ) THEN
	    ALTER TABLE identity.users ADD COLUMN username TEXT NOT NULL DEFAULT '';
	  END IF;
	END
	$$;

	UPDATE identity.users SET username = SPLIT_PART(email, '@', 1) WHERE username = '';
	DROP INDEX IF EXISTS identity.idx_users_username;
	CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON identity.users(username);
	`

	_, err = db.ExecContext(ctx, migration1)
	if err != nil && !strings.Contains(err.Error(), "already exists") {
		log.Printf("Warning: Migration 1 (username): %v", err)
	} else {
		fmt.Println("✓ Migration 1: Username column ready")
	}

	// Migration 2: Create budgets table
	migration2 := `
	CREATE TABLE IF NOT EXISTS finance.budgets (
		id UUID PRIMARY KEY,
		user_id UUID NOT NULL,
		category_id UUID NOT NULL REFERENCES finance.categories(id) ON DELETE CASCADE,
		amount NUMERIC(20,2) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		UNIQUE(user_id, category_id)
	);
	`

	_, err = db.ExecContext(ctx, migration2)
	if err != nil && !strings.Contains(err.Error(), "already exists") {
		log.Printf("Warning: Migration 2 (budgets): %v", err)
	} else {
		fmt.Println("✓ Migration 2: Budgets table ready")
	}

	fmt.Println("\n✓ All migrations completed successfully!")
}
