-- 002_transactions.sql
-- Creates finance schema: wallets, categories, transactions

CREATE SCHEMA IF NOT EXISTS finance;

CREATE TABLE IF NOT EXISTS finance.wallets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    balance NUMERIC(20,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance.categories (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL, -- income | expense
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance.transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL REFERENCES finance.wallets(id) ON DELETE RESTRICT,
    category_id UUID NULL REFERENCES finance.categories(id) ON DELETE SET NULL,
    amount NUMERIC(20,2) NOT NULL,
    kind TEXT NOT NULL, -- in | out
    note TEXT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- index for faster user queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred ON finance.transactions (user_id, occurred_at DESC);
