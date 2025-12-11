# LASTI - Personal Finance Management System

A full-stack application for managing personal finances with wallets, transactions, budgets, and analytics.

## Tech Stack

### Backend
- **Language**: Go 1.21
- **Framework**: Chi (HTTP router)
- **Database**: PostgreSQL 17
- **Authentication**: JWT tokens

### Frontend
- **Framework**: Next.js 14.2.8
- **Language**: TypeScript
- **UI**: React with inline CSS

## Project Structure

```
.
├── backend/              # Go backend service
│   ├── cmd/
│   │   ├── api/         # Main API server
│   │   └── migrate/     # Database migration tool
│   ├── internal/
│   │   ├── account/     # User authentication & management
│   │   ├── transaction/ # Wallets, transactions, categories
│   │   ├── budget/      # Budget management
│   │   ├── analytics/   # Analytics
│   │   ├── config/      # Configuration
│   │   ├── database/    # Database connection
│   │   ├── http/        # HTTP routes & middleware
│   │   ├── otp/         # OTP utilities
│   │   ├── security/    # Password hashing
│   │   ├── server/      # Server setup
│   │   └── token/       # JWT token management
│   ├── pkg/response/    # Shared response utilities
│   └── go.mod
├── frontend/            # Next.js frontend
│   ├── app/            # Pages & routes
│   ├── components/     # Reusable components
│   └── lib/            # Utilities & API clients
├── db/
│   └── migrations/     # Database schemas
└── docker-compose.yml  # Docker services
```

## Prerequisites

- Go 1.21+
- Node.js 18+
- PostgreSQL 17
- npm or yarn

## Setup & Installation

### 1. Backend Setup

```bash
cd backend
go mod download
```

### 2. Database Setup

Start PostgreSQL 17 and create the database:

```bash
createdb -U postgres -h localhost lasti
```

Run migrations:

```bash
cd backend
go run ./cmd/migrate
```

### 3. Backend Configuration

Create `.env` file in `backend/` folder:

```env
SERVER_PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/lasti
JWT_SECRET=your-secret-key-min-32-chars
APP_ENV=development
```

### 4. Start Backend

```bash
cd backend
go build -o app.exe ./cmd/api
./app.exe
```

Backend will run on `http://localhost:8080`

### 5. Frontend Setup

```bash
cd frontend
npm install
```

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000` (or `3001` if port conflict)

## Features

### Authentication
- Email/password registration
- Direct login (JWT tokens)
- Username support

### Finance Management
- **Wallets**: 1 wallet auto-created per user
- **Transactions**: Income and expense tracking
- **Categories**: Transaction categorization
- **Dashboard**: Balance overview with income/expense summary

### API Endpoints

#### Account
- `POST /api/v1/account/register` - Register new user
- `POST /api/v1/account/login` - Login user

#### Finance
- `GET /api/v1/wallets` - List user wallets
- `POST /api/v1/wallets` - Create wallet
- `GET /api/v1/transactions` - List transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category

## Database Schema

### identity.users
- id (UUID, PK)
- email (TEXT, UNIQUE)
- username (TEXT, UNIQUE)
- password_hash (TEXT)
- phone_number (TEXT, NULL)
- is_email_verified (BOOLEAN)
- is_phone_verified (BOOLEAN)
- created_at, updated_at (TIMESTAMP)

### finance.wallets
- id (UUID, PK)
- user_id (UUID, FK)
- type (TEXT)
- name (TEXT)
- balance (NUMERIC)
- created_at, updated_at (TIMESTAMP)

### finance.transactions
- id (UUID, PK)
- user_id (UUID, FK)
- wallet_id (UUID, FK)
- category_id (UUID, FK, NULL)
- amount (NUMERIC)
- kind (TEXT: 'in' or 'out')
- note (TEXT, NULL)
- occurred_at (TIMESTAMP)
- created_at (TIMESTAMP)

### finance.categories
- id (UUID, PK)
- user_id (UUID, FK)
- name (TEXT)
- kind (TEXT: 'in' or 'out')
- created_at (TIMESTAMP)

## Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Manual Deployment

1. Build backend: `go build -o lasti ./cmd/api`
2. Build frontend: `npm run build`
3. Start services with environment variables set
4. Ensure PostgreSQL is accessible and migrations are run

## Development Notes

- Frontend uses Next.js 14 with TypeScript
- Backend uses Chi router for HTTP handling
- CORS is configured for localhost:3000 and localhost:3001
- JWT tokens include username and email claims
- Passwords are hashed using bcrypt

## Troubleshooting

### CORS Errors
- Ensure backend CORS configuration includes frontend origin
- Check router.go for AllowedOrigins

### Database Connection
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run migrations if new tables needed

### Build Issues
- Go: Run `go mod tidy` to update dependencies
- Node: Run `npm install` to install dependencies
- Clear caches: `go clean -cache` / `npm cache clean --force`

## License

MIT
