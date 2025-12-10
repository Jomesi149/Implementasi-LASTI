CREATE TABLE IF NOT EXISTS finance.budgets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES finance.categories(id) ON DELETE CASCADE,
    amount NUMERIC(20,2) NOT NULL, -- Batas budget bulanan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, category_id)
);