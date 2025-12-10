-- Check wallets and users
SELECT 'Users:' as section;
SELECT id, email, created_at FROM identity.users LIMIT 10;

SELECT 'Wallets:' as section;
SELECT id, user_id, type, name, balance FROM finance.wallets LIMIT 10;

SELECT 'Transactions:' as section;
SELECT id, user_id, wallet_id, amount, kind FROM finance.transactions LIMIT 10;
