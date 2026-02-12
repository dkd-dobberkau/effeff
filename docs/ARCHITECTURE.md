# FormFlow Architecture

## Overview

FormFlow is a self-hosted Typeform clone. Users create forms via an admin UI, publish them, and collect submissions including file uploads.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  React Frontend  │────▶│  Rails API       │────▶│  SurrealDB  │
│  (Admin + Forms) │     │  (CRUD, Auth)    │     │             │
└─────────────────┘     └──────────────────┘     └─────────────┘
        │                       │                      ▲
        │               ┌──────┘                       │
        │               ▼                              │
        │         ┌───────────┐                        │
        │         │  Garage   │                        │
        │         │  (S3/Files)│                        │
        │         └───────────┘                        │
        │               ▲                              │
        │               │                              │
        │         ┌──────────────────┐                 │
        └────────▶│  Go Submissions  │─────────────────┘
        (submit)  │  (High Throughput)│
                  └──────────────────┘
```

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Rails API | 3000 | Form CRUD, Auth, Analytics, File proxy |
| Go Submissions | 8080 | High-throughput submissions + file uploads |
| React Frontend | 5173 | Admin UI + Public form renderer |
| SurrealDB | 8000 | Document database |
| Garage | 3900/3903 | S3-compatible object storage (files) |

## Authentication

JWT-based (HS256, 24h expiry). First admin registers freely; subsequent registrations require a valid JWT.

- `POST /api/v1/auth/login` — returns JWT + user
- `POST /api/v1/auth/register` — create admin (first is open, rest require JWT)
- `GET /api/v1/auth/me` — current user info
- `GET /api/v1/auth/status` — public, returns `{ has_admin: true/false }`

All admin endpoints require `Authorization: Bearer <token>`. Public endpoints (form renderer, submissions) are unauthenticated.

## Data Model

### `form`
- id, title, slug, description, theme, status (draft/published/archived)
- settings (JSON: redirect_url, notifications, branding)
- created_at, updated_at

### `question`
- id, form_id, type, title, subtitle, placeholder
- options (JSON array for choices)
- validations (JSON: required, pattern, min, max)
- position (sort order)
- settings (JSON: multi_select, max_rating, allowed_extensions, etc.)

### `submission`
- id, form_id, answers (JSON), metadata (IP, UA, duration)
- started_at, completed_at

### `form_stats`
- id, form_id, total_submissions, total_duration_seconds
- Incremented async on each submission

### `admin_user`
- id, email (unique), password_hash (bcrypt), name
- created_at, updated_at

## API Endpoints

### Rails API (`:3000`)

**Auth (public)**
```
POST   /api/v1/auth/login           # Login, returns JWT
POST   /api/v1/auth/register        # Register admin
GET    /api/v1/auth/me              # Current user (requires JWT)
GET    /api/v1/auth/status          # Has any admin?
```

**Forms (requires JWT)**
```
GET    /api/v1/forms                # List forms
POST   /api/v1/forms                # Create form
GET    /api/v1/forms/:id            # Get form by ID
PUT    /api/v1/forms/:id            # Update form
DELETE /api/v1/forms/:id            # Delete form
```

**Public form (no auth)**
```
GET    /api/v1/forms/public/:slug   # Get published form for rendering
```

**Questions (requires JWT)**
```
POST   /api/v1/forms/:id/questions          # Add question
PUT    /api/v1/forms/:id/questions/:qid     # Update question
DELETE /api/v1/forms/:id/questions/:qid     # Delete question
PUT    /api/v1/forms/:id/questions/reorder  # Reorder questions
```

**Submissions (requires JWT)**
```
GET    /api/v1/forms/:id/submissions  # List submissions
GET    /api/v1/submissions/:id        # Get single submission
GET    /api/v1/forms/:id/analytics    # Aggregated stats
```

**Files (requires JWT)**
```
GET    /api/v1/files/*path            # Proxy file download from S3
```

### Go Submissions (`:8080`)
```
POST   /submit/:formSlug             # Submit form (JSON or multipart)
GET    /health                        # Health check
```

## File Uploads

Files are stored in Garage (S3-compatible). The Go service handles uploads during form submission:

1. Frontend sends `multipart/form-data` when any `file_upload` answer exists
2. Go service extracts files, uploads to Garage at `forms/{formID}/{questionID}/{uuid}.{ext}`
3. S3 path is stored as the answer value in the submission
4. Rails proxies file downloads via `/api/v1/files/*path` (admin-only)

## Input Sanitization

Since SurrealDB's HTTP API doesn't support parameterized queries, both Rails and Go validate all inputs before constructing SurrealQL:

- **Record IDs**: must match `table:[a-zA-Z0-9]+`
- **Slugs**: must match `[a-z0-9][a-z0-9-]*[a-z0-9]`, 2-100 chars
- **Statuses**: must be in `[draft, published, archived]`
- **Strings**: escaped (`\` `'` null bytes, control chars)

Implementations: `rails-api/lib/surreal_sanitizer.rb`, `go-submissions/internal/store/sanitize.go`

## Question Types

Must stay in sync across four places:
1. `Question::VALID_TYPES` in `rails-api/app/models/question.rb`
2. `ASSERT $value IN [...]` in `docker/schema.surql`
3. Validation switch in `go-submissions/internal/validator/validator.go`
4. Renderer components in `frontend-admin/src/form-renderer/FormRenderer.jsx`

Types: `welcome`, `thank_you`, `text`, `email`, `long_text`, `multiple_choice`, `rating`, `number`, `date`, `url`, `phone`, `file_upload`, `statement`, `yes_no`

## Screenshots

See `docs/screenshots/` for UI screenshots of the admin dashboard and public form renderer.
