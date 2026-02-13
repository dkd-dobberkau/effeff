# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General Workflow

When the user places a file in the project and references it, search thoroughly using `Glob` before saying it can't be found. Check the project root, common directories, and ask the user if still not located.

## What is effeff?

effeff is a self-hosted Typeform clone. Users create forms via an admin UI, publish them, and collect submissions including file uploads. Five services orchestrated via Docker Compose.

## Architecture

Three application services share one SurrealDB instance, with Garage for file storage:

- **Rails API** (`rails-api/`, port 3000) – Form and question CRUD, submission reads, analytics, JWT auth, file proxy. API-only mode, no ActiveRecord.
- **Go Submissions** (`go-submissions/`, port 8080) – Receives and validates form submissions at high throughput. Handles file uploads to S3. This is the only service that writes submissions.
- **React Frontend** (`frontend-admin/`, port 5173) – Admin dashboard and public form renderer. Vite + React 18 + Tailwind CSS. Uses dnd-kit for drag-and-drop question reordering.
- **SurrealDB** (port 8000) – Document-style NoSQL database. Schema defined in `docker/schema.surql`.
- **Garage** (port 3900 S3 API, port 3903 admin) – S3-compatible object storage for file uploads. Config in `docker/garage.toml`. Admin API uses v2 endpoints (`/v2/GetClusterHealth`, `/v2/CreateBucket`, etc.). The Docker image is minimal (no shell, no curl) — healthcheck uses `/garage stats`.

The split rationale: Rails handles the comfortable CRUD/admin work, Go handles the hot path (submissions + file uploads) where throughput matters.

## Commands

### Full stack (Docker)
```bash
docker compose up --build

# Init DB schema (required on first run):
docker compose exec surrealdb /bin/sh -c \
  "curl -X POST 'http://localhost:8000/import' \
    -H 'surreal-ns: effeff' -H 'surreal-db: main' \
    -u 'root:effeff_secret' \
    --data-binary @/docker/schema.surql"

# Init Garage S3 (required on first run, after garage is healthy):
# Run from host — Garage image is minimal (no shell, no curl):
GARAGE_ADMIN=http://localhost:3903 sh docker/garage-init.sh
# Copy the printed S3_ACCESS_KEY and S3_SECRET_KEY into docker-compose.yml,
# then: docker compose restart go-submissions
```

### Individual services (local dev)
```bash
# Rails (needs JWT_SECRET env var)
cd rails-api && bundle install && JWT_SECRET=dev_secret bundle exec rails server -p 3000

# Go
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
```bash
# Go (handler + validator tests)
cd go-submissions && go test ./...

# Frontend (vitest — API client, theme, hooks)
cd frontend-admin && npm test

# Rails (rspec — models, requests, SurrealClient)
cd rails-api && bundle exec rspec
```

## Database (SurrealDB)

Schema lives in `docker/schema.surql`. Five tables: `form`, `question`, `submission`, `form_stats`, `admin_user`.

Connection details (dev): user `root`, pass `effeff_secret`, namespace `effeff`, database `main`. All services read credentials from env vars (`SURREAL_URL`/`SURREAL_HTTP_URL`, `SURREAL_USER`, `SURREAL_PASS`, `SURREAL_NS`, `SURREAL_DB`).

Both Rails and Go talk to SurrealDB via its **HTTP REST API** (`POST /sql` with raw SurrealQL). Neither uses WebSocket RPC.

### SurrealDB record IDs
IDs use `table:id` format (e.g., `form:abc123`, `question:xyz789`). In SurrealQL, reference them as bare IDs without quotes: `SELECT * FROM form:abc123`, `UPDATE question:xyz789 SET ...`, `WHERE form_id = form:abc123`.

### SurrealDB reserved keywords
`value` is a reserved keyword in SurrealDB v2.1 — it is silently dropped from objects even with backtick escaping. Submission answers store the answer data as `answer_value` in the DB. The Go store transforms `value` → `answer_value` on write, and the Rails Submission model maps `answer_value` → `value` on read. The external API always uses `value`. Additionally, nested object fields (`answers[*]`) must be `FLEXIBLE TYPE object` — strict `TYPE object` silently drops sub-fields.

### Modifying the schema
Edit `docker/schema.surql` and re-import. `DEFINE TABLE` and `DEFINE FIELD` are idempotent.

## Rails API details

Models are plain Ruby classes that construct SurrealQL queries via `SurrealClient` (`lib/surreal_client.rb`). The global client is initialized in `config/initializers/surreal.rb` as `SURREAL`.

Key patterns:
- `SURREAL.query(sql)` returns array of result sets, `query_first(sql)` returns first result set, `query_one(sql)` returns single record
- Models use `from_surreal(record)` class methods to hydrate from hash results
- Input sanitization via `SurrealSanitizer` module (`lib/surreal_sanitizer.rb`): validates record IDs, slugs, statuses, integers and escapes strings for SurrealQL. All models use this — never interpolate user input directly.
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
- `GET /health` — health check

`AdminUser` model uses bcrypt for password hashing. JWT secret from `ENV['JWT_SECRET']`, HS256 algorithm, 24h expiry.

### File proxy

`GET /api/v1/files/*path` proxies files from S3 storage. Requires auth (admin only). Uses `S3_ENDPOINT` and `S3_BUCKET` env vars.

Error handling: `SurrealClient::QueryError`, `SurrealClient::NotFoundError`, `SurrealSanitizer::InvalidInputError`, and `JWT::DecodeError` are rescued globally in `ApplicationController`.

No SurrealDB connection retry (unlike Go which retries 30 times on startup).

## Go Submissions details

Module path: `github.com/dkd-dobberkau/effeff-go`

Submission flow:
1. `POST /submit/{formSlug}` hits `handlers.SubmitForm`
2. Slug is validated against regex before any DB call
3. Handler fetches form + questions from SurrealDB via `store.GetFormBySlug`
4. If multipart: files are uploaded to S3, answer values replaced with S3 URLs
5. `validator.ValidateSubmission` checks all answers against question definitions
6. On success, `store.CreateSubmission` writes to SurrealDB
7. `store.IncrementFormStats` runs async in a goroutine

Dependencies: chi (router), cors, httprate (rate limiting at 60/min per IP), minio-go (S3 client), uuid. No ORM. Go 1.24, built via `golang:1.24-alpine` in Dockerfile.

Input sanitization via `store/sanitize.go`: validates slugs and record IDs before query construction, escapes strings for SurrealQL.

The handler supports both `application/json` and `multipart/form-data` submissions. Multipart is used when files are attached: `answers` JSON in a form field, files keyed by question ID. Max upload size: 32 MB.

### File uploads

S3-compatible storage via Garage (or any S3 backend). Files are uploaded to `forms/{formID}/{questionID}/{uuid}.{ext}`. Storage is optional — if `S3_ENDPOINT`/`S3_ACCESS_KEY`/`S3_SECRET_KEY` are not set, file uploads are disabled gracefully. Config env vars: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_USE_SSL`.

Validation error messages are in **German** (user-facing).

## Frontend details

The API client (`src/api/client.js`) exports four namespaces:
- `auth.*` – login, register, me, status
- `forms.*` – talks to Rails API for CRUD
- `questions.*` – talks to Rails API for question management
- `submissions.submit()` / `submissions.submitWithFiles()` – talks to Go service

The client auto-attaches `Authorization: Bearer` header from localStorage for Rails API calls. On 401, it clears the token and redirects to `/login`. For file uploads, `submitWithFiles()` sends `FormData` (no explicit `Content-Type` header, browser sets multipart boundary).

Auth is managed via `AuthContext` (`src/context/AuthContext.jsx`). Admin routes are wrapped in `ProtectedRoute`. The login page auto-detects whether to show register (if no admin exists) or login form.

### Key frontend routes
- `/` — Forms list (admin, protected)
- `/forms/:id` — Form editor (admin, protected)
- `/forms/:id/submissions` — Submissions view (admin, protected)
- `/login` — Login/register page (public)
- `/f/:slug` — Public form renderer (public)

Env vars: `VITE_RAILS_API_URL`, `VITE_GO_SUBMISSIONS_URL`.

## Cross-service sync points

**Question types** must stay in sync across four places when adding a new type:
1. `Question::VALID_TYPES` in `rails-api/app/models/question.rb`
2. `ASSERT $value IN [...]` on `question.type` in `docker/schema.surql`
3. Validation switch in `go-submissions/internal/validator/validator.go`
4. Question component rendering in `frontend-admin/src/form-renderer/FormRenderer.jsx`

Current valid types: `welcome`, `thank_you`, `text`, `email`, `long_text`, `multiple_choice`, `rating`, `number`, `date`, `url`, `phone`, `file_upload`, `statement`, `yes_no`.

**Record ID validation** — must stay in sync between `SurrealSanitizer::VALID_TABLES` (Ruby) and `recordIDRegex` in `store/sanitize.go` (Go). Update both when adding new tables.

**New API endpoints**: Add route in `rails-api/config/routes.rb` + controller action. If it touches submissions, decide whether it belongs in Rails (reads/analytics) or Go (writes). Protected by default — add `skip_before_action :authenticate!` for public endpoints.

## Style and conventions

- Rails: standard Ruby style, no ActiveRecord, models in `app/models/`, keep controllers thin
- Go: standard project layout (`cmd/` for entrypoints, `internal/` for private packages), Chi router, no interface abstractions unless needed
- Frontend: functional React, hooks, no class components, API calls via the centralized client
- All services log to stdout for Docker
- German language in user-facing form content and UI labels, English in code and API responses

## Documentation

- `README.md` — Project overview, features, screenshots, quick start, API examples
- `docs/SETUP.md` — Full setup guide: Docker, local dev, Garage init, env vars, troubleshooting
- `docs/ARCHITECTURE.md` — API reference, data model, auth, file uploads, question types
- `docs/screenshots/` — 15 UI screenshots (admin dashboard + public form renderer)

## Docker

When working with Docker, always use `docker compose build --no-cache` or `--build` flag when testing changes to Dockerfiles or docker-compose configs. Never assume cached images reflect recent changes.

When creating Dockerfiles based on existing images (e.g., Playwright), always check for existing users/UIDs before creating new ones. Run `id` or check `/etc/passwd` in the base image first.

## Deployment & Infrastructure

When deploying or making infrastructure changes (Mittwald, AWS, Docker stacks), always confirm the scope of the operation before executing. Specifically: `mw stack deploy` replaces the ENTIRE stack — never run destructive deployment commands without explicitly warning about side effects.

Before running any deployment or infrastructure command, first present a summary of exactly what it will do — list what will be **created**, **modified**, and **deleted**. Wait for explicit user approval before executing.

## Database Notes

When working with SurrealDB, remember that schemafull/strict tables silently drop unrecognized fields including nested objects. Always use `FLEXIBLE TYPE object` for tables that store dynamic or nested data. The keyword `value` is reserved — use alternative column names like `answer_value`.

## Verification & Testing

After making changes, always verify the actual outcome rather than trusting status codes or logs alone. For example, if a form submission returns 'ok', still verify the data actually arrived at its destination (e.g., Google Sheets, database).

After deploying or submitting data, use Playwright to verify the result end-to-end. Don't just check the HTTP status — navigate to the actual destination (Google Sheet, deployed URL, database UI) and confirm the data or page is actually there.

## TYPO3

For TYPO3 projects: always check the exact CLI commands available in the user's TYPO3 version before running them. Commands differ significantly between v12, v13, and v14. Also bump version in `ext_emconf.php` before creating a TER release.

## Known limitations

- No webhook dispatch on new submissions
- Garage S3 requires manual init (`docker/garage-init.sh`) after first `docker compose up` — access key/secret must be copied to env vars
- No password reset flow
- No multi-tenant / organization support
