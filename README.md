# Budgetin - Personal Finance Management System

Aplikasi full-stack untuk mengelola dompet, transaksi, anggaran, dan analitik keuangan pribadi.

Kelompok 04 - K02
Muhammad Farhan/ 18223004
Henrycus Hugatama Risaldy/ 18223008
Mudzaki Kaarzaqiel Hakim / 18223024
Darryl Rizqi/ 18223084
Raditya Zaki Athaya/ 18223086
Joan Melkior Silaen/ 18223102


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

## Struktur Proyek

```
.
├── backend/
│   ├── cmd/
│   │   ├── api             # Server HTTP utama
│   │   └── migrate         # Tool untuk migrasi berbasis Go
│   ├── internal/           # Modul bisnis (account, transaction, budget, dll.)
│   ├── pkg/response/       # Utilitas respons HTTP
│   └── go.mod
├── frontend/            # Next.js frontend
│   ├── app/            # Pages & routes
│   ├── components/     # Reusable components
│   └── lib/            # Utilities & API clients
├── db/
│   └── migrations/     # Database schemas
└── docker-compose.yml  # Docker services
```

## 1.Setup & Installation

1. **Clone repo & instal dependensi Go**
   ```bash
   git clone https://github.com/Jomesi149/Implementasi-LASTI.git
   cd Implementasi-LASTI/backend
   go mod download
   ```

2. **Buat berkas `backend/.env`**
   ```env
   APP_ENV=development
   HTTP_PORT=8080
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/lasti?sslmode=disable
   JWT_SECRET=isi-dengan-string-acak-minimal-32-karakter
   OTP_WINDOW_SECONDS=300
   ```

3. **Buat database PostgreSQL**
   ```bash
   createdb -U postgres -h localhost lasti
   ```
   Tambahkan `-W` jika akun Postgres menggunakan password.

## 2. Migrasi Database (Wajib)

Backend mengharuskan skema `identity` dan `finance`. Lakukan dua tahap berikut sebelum menjalankan server.

1. **SQL dasar (schema + tabel)**
   ```bash
   cd Implementasi-LASTI
   psql -U postgres -d lasti -f db/migrations/001_init.sql
   psql -U postgres -d lasti -f db/migrations/004_add_username.sql
   psql -U postgres -d lasti -f db/migrations/005_complete_sync.sql
   ```

2. **Patch tambahan via tool Go**
   ```bash
   cd backend
   go run ./cmd/migrate
   ```
   Abaikan peringatan "already exists" karena artinya struktur sudah siap.

## 3. Menjalankan Backend

```bash
cd backend
go run ./cmd/api
```

Server listen di `http://localhost:8080`. Uji dengan membuka `http://localhost:8080/health` (respon `{"status":"ok"}`).

### 1. Frontend Setup

```bash
cd frontend
npm install
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`. Basis URL API default `http://localhost:8080/api/v1` (lihat `frontend/lib/constants.ts`). Jika backend berada di alamat lain, set `NEXT_PUBLIC_API_BASE_URL` pada `frontend/.env.local` lalu restart dev server.

## 4. Menjalankan via Docker Compose

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
