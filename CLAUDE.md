# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is FormFlow?

FormFlow is a self-hosted Typeform clone. Users create forms via an admin UI, publish them, and collect submissions. Three services plus a database, orchestrated via Docker Compose.

## Architecture

Three services share one SurrealDB instance, with Garage for file storage:

- **Rails API** (`rails-api/`, port 3000) – Form and question CRUD, submission reads, analytics, auth. API-only mode, no ActiveRecord.
- **Go Submissions** (`go-submissions/`, port 8080) – Receives and validates form submissions at high throughput. Handles file uploads to S3. This is the only service that writes submissions.
- **React Frontend** (`frontend-admin/`, port 5173) – Admin dashboard and public form renderer. Vite + React 18 + Tailwind CSS. Uses dnd-kit for drag-and-drop question reordering.
- **SurrealDB** (port 8000) – Document-style NoSQL database. Schema defined in `docker/schema.surql`.
- **Garage** (port 3900 S3 API, port 3903 admin) – S3-compatible object storage for file uploads. Config in `docker/garage.toml`.

The split rationale: Rails handles the comfortable CRUD/admin work, Go handles the hot path (submissions + file uploads) where throughput matters.

## Commands

### Full stack (Docker)
```bash
docker compose up --build

# Init DB schema (required on first run):
docker compose exec surrealdb /bin/sh -c \
  "curl -X POST 'http://localhost:8000/import' \
    -H 'surreal-ns: formflow' -H 'surreal-db: main' \
    -u 'root:formflow_secret' \
    --data-binary @/docker/schema.surql"
```

### Individual services (local dev)
```bash
# Rails
cd rails-api && bundle install && bundle exec rails server -p 3000

# Go (run go mod tidy first — go.sum is not committed)
cd go-submissions && go mod tidy && go run ./cmd/server

# Frontend
cd frontend-admin && npm install && npm run dev
```

### Build and lint
```bash
# Go
cd go-submissions && go build ./cmd/server
cd go-submissions && go vet ./...

# Frontend
cd frontend-admin && npm run build
```

### Tests
No test suites exist yet. Rails has `rspec-rails` and `factory_bot_rails` in the Gemfile test group but no specs are written. Go and frontend have no test setup.

## Database (SurrealDB)

Schema lives in `docker/schema.surql`. Five tables: `form`, `question`, `submission`, `form_stats`, `admin_user`.

Connection details (dev): user `root`, pass `formflow_secret`, namespace `formflow`, database `main`. All services read credentials from env vars (`SURREAL_URL`/`SURREAL_HTTP_URL`, `SURREAL_USER`, `SURREAL_PASS`, `SURREAL_NS`, `SURREAL_DB`).

Both Rails and Go talk to SurrealDB via its **HTTP REST API** (`POST /sql` with raw SurrealQL). Neither uses WebSocket RPC.

### SurrealDB record IDs
IDs use `table:id` format (e.g., `form:abc123`, `question:xyz789`). In SurrealQL, reference them as bare IDs without quotes: `SELECT * FROM form:abc123`, `UPDATE question:xyz789 SET ...`, `WHERE form_id = form:abc123`.

### Modifying the schema
Edit `docker/schema.surql` and re-import. `DEFINE TABLE` and `DEFINE FIELD` are idempotent.

## Rails API details

Models are plain Ruby classes that construct SurrealQL queries via `SurrealClient` (`lib/surreal_client.rb`). The global client is initialized in `config/initializers/surreal.rb` as `SURREAL`.

Key patterns:
- `SURREAL.query(sql)` returns array of result sets, `query_first(sql)` returns first result set, `query_one(sql)` returns single record
- Models use `from_surreal(record)` class methods to hydrate from hash results
- Input sanitization via `SurrealSanitizer` module (`lib/surreal_sanitizer.rb`): validates record IDs, slugs, statuses, integers and escapes strings for SurrealQL
- Form slugs are auto-generated from title + random hex suffix
- Questions are ordered by `position` field, reorderable via `PUT /api/v1/forms/:id/questions/reorder`

Routes are namespaced under `/api/v1/`. Public form endpoint: `GET /api/v1/forms/public/:slug`.

### Authentication

JWT-based authentication (`lib/jwt_service.rb`). All admin endpoints require `Authorization: Bearer <token>` header. The following are public (no auth):
- `GET /api/v1/forms/public/:slug` — public form rendering
- `POST /api/v1/auth/login` — email/password login
- `POST /api/v1/auth/register` — first user registers freely, subsequent require valid JWT
- `GET /api/v1/auth/status` — returns `{ has_admin: true/false }`
- `GET /api/v1/auth/me` — requires JWT, returns current user

`AdminUser` model uses bcrypt for password hashing. JWT secret from `ENV['JWT_SECRET']`, HS256 algorithm, 24h expiry.

Error handling: `SurrealClient::QueryError`, `SurrealClient::NotFoundError`, `SurrealSanitizer::InvalidInputError`, and `JWT::DecodeError` are rescued globally in `ApplicationController`.

No SurrealDB connection retry (unlike Go which retries 30 times on startup).

## Go Submissions details

Module path: `github.com/formflow/go-submissions`

Submission flow:
1. `POST /submit/{formSlug}` hits `handlers.SubmitForm`
2. Handler fetches form + questions from SurrealDB via `store.GetFormBySlug`
3. `validator.ValidateSubmission` checks all answers against question definitions
4. On success, `store.CreateSubmission` writes to SurrealDB
5. `store.IncrementFormStats` runs async in a goroutine

Dependencies: chi (router), cors, httprate (rate limiting at 60/min per IP), minio-go (S3 client), uuid. No ORM.

Input sanitization via `store/sanitize.go`: validates slugs and record IDs before query construction.

The handler supports both `application/json` and `multipart/form-data` submissions. Multipart is used when files are attached: `answers` JSON in a form field, files keyed by question ID.

### File uploads

S3-compatible storage via Garage (or any S3 backend). Files are uploaded to `forms/{formID}/{questionID}/{uuid}.{ext}`. Storage is optional — if `S3_ENDPOINT`/`S3_ACCESS_KEY`/`S3_SECRET_KEY` are not set, file uploads are disabled gracefully. Config env vars: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_USE_SSL`.

Validation error messages are in **German** (user-facing).

## Frontend details

The API client (`src/api/client.js`) exports four namespaces:
- `auth.*` – login, register, me, status
- `forms.*` – talks to Rails API for CRUD
- `questions.*` – talks to Rails API for question management
- `submissions.submit()` / `submissions.submitWithFiles()` – talks to Go service

The client auto-attaches `Authorization: Bearer` header from localStorage for Rails API calls. On 401, it clears the token and redirects to `/login`.

Auth is managed via `AuthContext` (`src/context/AuthContext.jsx`). Admin routes are wrapped in `ProtectedRoute`. The login page auto-detects whether to show register (if no admin exists) or login form.

Env vars: `VITE_RAILS_API_URL`, `VITE_GO_SUBMISSIONS_URL`.

## Cross-service sync points

**Question types** must stay in sync across three places when adding a new type:
1. `Question::VALID_TYPES` in `rails-api/app/models/question.rb`
2. `ASSERT $value IN [...]` on `question.type` in `docker/schema.surql`
3. Validation switch in `go-submissions/internal/validator/validator.go`

Current valid types: `welcome`, `thank_you`, `text`, `email`, `long_text`, `multiple_choice`, `rating`, `number`, `date`, `url`, `phone`, `file_upload`, `statement`, `yes_no`.

**New API endpoints**: Add route in `rails-api/config/routes.rb` + controller action. If it touches submissions, decide whether it belongs in Rails (reads/analytics) or Go (writes).

## Style and conventions

- Rails: standard Ruby style, no ActiveRecord, models in `app/models/`, keep controllers thin
- Go: standard project layout (`cmd/` for entrypoints, `internal/` for private packages), Chi router, no interface abstractions unless needed
- Frontend: functional React, hooks, no class components, API calls via the centralized client
- All services log to stdout for Docker
- German language in user-facing form content, English in code and API responses

## Known limitations

- No webhook dispatch on new submissions
- Garage S3 requires manual init (`docker/garage-init.sh`) after first `docker compose up` — access key/secret must be copied to env vars
- No password reset flow
- No multi-tenant / organization support
