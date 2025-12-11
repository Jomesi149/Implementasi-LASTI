# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables set in `.env` files
- [ ] Database migrations applied (`go run ./cmd/migrate`)
- [ ] Backend builds successfully (`go build -o app.exe ./cmd/api`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] All tests pass
- [ ] No console errors in development

## Backend Checklist

- [ ] Go version compatible (1.21+)
- [ ] All dependencies in go.mod resolved
- [ ] DATABASE_URL points to production database
- [ ] JWT_SECRET is securely configured (32+ chars)
- [ ] Server PORT is properly configured
- [ ] CORS origins updated for production domain
- [ ] Executable built and tested

### Backend CORS Configuration

Update in `backend/internal/http/router.go`:
```go
AllowedOrigins: []string{"https://yourdomain.com", "https://www.yourdomain.com"},
```

## Frontend Checklist

- [ ] Node.js version compatible (18+)
- [ ] All dependencies installed (`npm install`)
- [ ] API_URL environment variable set to backend domain
- [ ] Build succeeds without errors (`npm run build`)
- [ ] No console warnings in production build
- [ ] Environment variables exported or configured

## Database Checklist

- [ ] PostgreSQL 17+ running
- [ ] Database created: `lasti`
- [ ] All migrations applied
- [ ] Backups configured
- [ ] Connection string secure (credentials stored safely)
- [ ] Database user has minimal required permissions

## Post-Deployment

- [ ] Health check endpoint responds: `GET /health`
- [ ] Login flow works end-to-end
- [ ] Register new user and verify wallet creation
- [ ] Transactions can be created and balance updates
- [ ] Backend logs show no errors
- [ ] Frontend loads without 404 errors
- [ ] CORS requests succeed
- [ ] JWT tokens include username and email claims

## Production Considerations

1. **Security**
   - Use HTTPS for all traffic
   - Set secure JWT_SECRET (cryptographically random)
   - Configure CORS properly (whitelist domains only)
   - Use environment variables for secrets (never hardcode)
   - Enable database SSL connections

2. **Performance**
   - Configure database connection pooling
   - Enable frontend caching headers
   - Compress assets
   - Use CDN for static assets

3. **Monitoring**
   - Set up error logging
   - Monitor database performance
   - Track API response times
   - Monitor server resources

4. **Backup & Recovery**
   - Regular database backups
   - Document recovery procedures
   - Test backup restoration

## Cleanup Done

- ✅ Removed `lasti.exe~` (backup executable)
- ✅ Removed `.next/` build folder
- ✅ Created `.gitignore` with proper exclusions
- ✅ Created comprehensive README.md
- ✅ Organized database migrations
- ✅ Cleaned up temporary files

## Files Safe to Delete Before Deploy

- `/backend/cmd/migrate/` - Migration tool (only needed for setup)
- `/db/migrations/002_transactions.sql`, `003_budgets.sql` - If using code migrations instead
- Any `.log`, `.tmp`, or backup files

## Database Migration Tool

The `backend/cmd/migrate/main.go` is a helper tool for applying migrations. In production, you can:

1. Keep it and run before deployment
2. Remove it and apply migrations manually via SQL
3. Integrate migrations into application startup code

Current approach: Run manually before deployment:
```bash
go run ./cmd/migrate
```
