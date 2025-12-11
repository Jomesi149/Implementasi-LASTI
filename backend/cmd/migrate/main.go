package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"

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

	// Run migration
	migration := `
	-- Add username column to users table if not exists
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

	-- For existing users, set username from email (part before @)
	UPDATE identity.users SET username = SPLIT_PART(email, '@', 1) WHERE username = '';

	-- Drop existing index if exists
	DROP INDEX IF EXISTS idx_users_username;

	-- Create unique index for username
	CREATE UNIQUE INDEX idx_users_username ON identity.users(username);
	`

	ctx := context.Background()
	_, err = db.ExecContext(ctx, migration)
	if err != nil {
		// Check if error is about column already existing
		if err.Error() != "pq: column \"username\" of relation \"users\" already exists" {
			log.Fatalf("Migration failed: %v", err)
		}
		fmt.Println("✓ Column already exists, skipping migration")
	} else {
		fmt.Println("✓ Migration completed successfully")
	}
}
