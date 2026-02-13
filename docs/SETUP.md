# effeff Setup Guide

## Prerequisites

- Docker and Docker Compose
- For local dev without Docker: Ruby 3.3+, Go 1.24+, Node.js 18+

## Docker Setup (Recommended)

### 1. Start the stack

```bash
docker compose up --build
```

This starts five services:

| Service | URL |
|---------|-----|
| Frontend (Admin + Forms) | http://localhost:5173 |
| Rails API | http://localhost:3000 |
| Go Submissions | http://localhost:8080 |
| SurrealDB | http://localhost:8000 |
| Garage S3 API | http://localhost:3900 |
| Garage Admin API | http://localhost:3903 |

### 2. Import the database schema

Required on first run, or after schema changes:

```bash
docker compose exec surrealdb /bin/sh -c \
  "curl -X POST 'http://localhost:8000/import' \
    -H 'surreal-ns: effeff' -H 'surreal-db: main' \
    -u 'root:effeff_secret' \
    --data-binary @/docker/schema.surql"
```

The schema file is mounted from `docker/schema.surql`. It's idempotent — safe to re-run.

### 3. Register the first admin

Open http://localhost:5173. Since no admin exists yet, the login page shows a registration form. Create your account with email and password.

Subsequent admin registrations require an existing admin's JWT token.

### 4. Set up Garage (file uploads)

File uploads require initializing Garage's storage layout and creating access credentials.

Run the bootstrap script from inside the Docker network:

```bash
docker compose exec rails-api sh /docker/garage-init.sh
```

The script will output S3 credentials:

```
============================================
Garage S3 credentials:
  S3_ACCESS_KEY=GKxxxxxxxxxxxxxxxxxxxx
  S3_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  S3_ENDPOINT=garage:3900
  S3_BUCKET=effeff-uploads
============================================
```

Add these credentials to the `go-submissions` environment in `docker-compose.yml`:

```yaml
go-submissions:
  environment:
    S3_ACCESS_KEY: "GKxxxxxxxxxxxxxxxxxxxx"
    S3_SECRET_KEY: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Then restart the Go service:

```bash
docker compose restart go-submissions
```

Without these credentials, form submissions still work — file upload fields are simply skipped.

---

## Local Development (without Docker)

Run SurrealDB and Garage in Docker, develop services locally:

```bash
docker compose up surrealdb garage
```

### Rails API

```bash
cd rails-api
bundle install
```

Export environment variables (or create `.env`):

```bash
export SURREAL_HTTP_URL="http://localhost:8000"
export SURREAL_USER="root"
export SURREAL_PASS="effeff_secret"
export SURREAL_NS="effeff"
export SURREAL_DB="main"
export JWT_SECRET="effeff_dev_jwt_secret_change_in_production"
export S3_ENDPOINT="http://localhost:3900"
export S3_BUCKET="effeff-uploads"
```

```bash
bundle exec rails server -p 3000
```

### Go Submissions

```bash
cd go-submissions
go mod tidy    # required — go.sum is not committed
```

Export environment variables:

```bash
export SURREAL_URL="http://localhost:8000"
export SURREAL_USER="root"
export SURREAL_PASS="effeff_secret"
export SURREAL_NS="effeff"
export SURREAL_DB="main"
export PORT="8080"
export S3_ENDPOINT="localhost:3900"
export S3_ACCESS_KEY="<from garage-init>"
export S3_SECRET_KEY="<from garage-init>"
export S3_BUCKET="effeff-uploads"
export S3_USE_SSL="false"
```

```bash
go run ./cmd/server
```

### React Frontend

```bash
cd frontend-admin
npm install
```

Create `.env.local`:

```
VITE_RAILS_API_URL=http://localhost:3000
VITE_GO_SUBMISSIONS_URL=http://localhost:8080
```

```bash
npm run dev
```

The dev server runs on http://localhost:5173 with hot reload.

---

## Running Tests

```bash
# Go
cd go-submissions && go test ./...

# Frontend
cd frontend-admin && npm test

# Rails
cd rails-api && bundle exec rspec
```

---

## Database

### Connection details (dev)

| Setting | Value |
|---------|-------|
| URL | http://localhost:8000 |
| User | root |
| Password | effeff_secret |
| Namespace | effeff |
| Database | main |

### Schema changes

Edit `docker/schema.surql` and re-import. All `DEFINE` statements are idempotent.

### Direct queries

```bash
curl -X POST 'http://localhost:8000/sql' \
  -H 'surreal-ns: effeff' -H 'surreal-db: main' \
  -u 'root:effeff_secret' \
  -d 'SELECT * FROM form'
```

### Reset database

```bash
docker compose down -v    # removes all volumes
docker compose up --build
# Re-import schema (step 2)
```

---

## Environment Variables Reference

### Rails API

| Variable | Description |
|----------|-------------|
| `SURREAL_HTTP_URL` | SurrealDB HTTP endpoint |
| `SURREAL_USER` | SurrealDB username |
| `SURREAL_PASS` | SurrealDB password |
| `SURREAL_NS` | SurrealDB namespace |
| `SURREAL_DB` | SurrealDB database |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `S3_ENDPOINT` | Garage S3 endpoint (for file proxy) |
| `S3_BUCKET` | S3 bucket name |

### Go Submissions

| Variable | Description |
|----------|-------------|
| `SURREAL_URL` | SurrealDB HTTP endpoint |
| `SURREAL_USER` | SurrealDB username |
| `SURREAL_PASS` | SurrealDB password |
| `SURREAL_NS` | SurrealDB namespace |
| `SURREAL_DB` | SurrealDB database |
| `PORT` | Server listen port (default: 8080) |
| `S3_ENDPOINT` | Garage S3 endpoint (optional) |
| `S3_ACCESS_KEY` | S3 access key (optional) |
| `S3_SECRET_KEY` | S3 secret key (optional) |
| `S3_BUCKET` | S3 bucket name |
| `S3_USE_SSL` | Use HTTPS for S3 (default: false) |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_RAILS_API_URL` | Rails API base URL |
| `VITE_GO_SUBMISSIONS_URL` | Go submissions base URL |

---

## Troubleshooting

**SurrealDB won't start** — Check if port 8000 is already in use. Remove volumes with `docker compose down -v` for a clean start.

**Go service can't connect to SurrealDB** — The Go service retries 30 times on startup. If SurrealDB is slow to start, it will connect eventually. Check logs: `docker compose logs go-submissions`.

**Garage init fails** — Ensure the Garage container is healthy before running the init script: `docker compose ps`.

**File uploads not working** — Verify S3 credentials are set in the Go service environment. Without them, the service starts but skips file uploads silently.

**"Formular nicht gefunden" on public form** — The form must have status `published`. Check via the admin UI or query SurrealDB directly.
