-- Add username column to users table
ALTER TABLE identity.users ADD COLUMN username TEXT NOT NULL DEFAULT '';

-- Create index for username
CREATE UNIQUE INDEX idx_users_username ON identity.users(username);

-- For existing users, set username from email (part before @)
UPDATE identity.users SET username = SPLIT_PART(email, '@', 1) WHERE username = '';
