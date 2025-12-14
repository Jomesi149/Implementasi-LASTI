-- 005_complete_sync.sql
-- Migrasi lengkap untuk sinkronisasi semua tabel yang diperlukan
-- Jalankan file ini di PostgreSQL untuk membuat semua tabel yang kurang

-- ============================================
-- 1. FINANCE SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS finance;

-- ============================================
-- 2. WALLETS TABLE (harus pertama - tidak ada dependency)
-- ============================================
CREATE TABLE IF NOT EXISTS finance.wallets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    balance NUMERIC(20,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON finance.wallets(user_id);

-- ============================================
-- 3. CATEGORIES TABLE (harus kedua - budgets depends on this)
-- ============================================
CREATE TABLE IF NOT EXISTS finance.categories (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON finance.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_kind ON finance.categories(kind);

-- ============================================
-- 4. TRANSACTIONS TABLE (depends on wallets & categories)
-- ============================================
CREATE TABLE IF NOT EXISTS finance.transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL REFERENCES finance.wallets(id) ON DELETE RESTRICT,
    category_id UUID NULL REFERENCES finance.categories(id) ON DELETE SET NULL,
    amount NUMERIC(20,2) NOT NULL,
    kind TEXT NOT NULL,
    note TEXT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred ON finance.transactions (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON finance.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON finance.transactions(wallet_id);

-- ============================================
-- 5. BUDGETS TABLE (depends on categories)
-- ============================================
CREATE TABLE IF NOT EXISTS finance.budgets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES finance.categories(id) ON DELETE CASCADE,
    amount NUMERIC(20,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON finance.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON finance.budgets(category_id);

-- ============================================
-- 6. USERNAME COLUMN (jika belum ada di identity.users)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'identity' 
        AND table_name = 'users' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE identity.users ADD COLUMN username TEXT;
    END IF;
END $$;

-- ============================================
-- VERIFICATION - Jalankan untuk cek tabel
-- ============================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'finance';

-- SELECT table_schema, table_name 
-- FROM information_schema.tables 
-- WHERE table_schema IN ('identity', 'finance')
-- ORDER BY table_schema, table_name;

-- ============================================
-- CATATAN PENTING:
-- ============================================
-- 1. Tabel 'finance.budgets' digunakan untuk menyimpan batas pengeluaran per kategori
-- 2. Kolom 'kind' di categories menggunakan 'in' atau 'out' (BUKAN 'income'/'expense')
-- 3. Kolom 'kind' di transactions juga menggunakan 'in' atau 'out'
-- 4. Setiap user baru akan otomatis mendapat:
--    - 1 wallet default ("Dompet Utama")
--    - 6 kategori default (4 pengeluaran + 2 pemasukan)
