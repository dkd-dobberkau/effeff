# FormFlow – Typeform Clone

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  React Frontend  │────▶│  Rails API       │────▶│  SurrealDB  │
│  (Admin + Forms) │     │  (CRUD, Admin)   │────▶│             │
└─────────────────┘     └──────────────────┘     └─────────────┘
        │                                              ▲
        │               ┌──────────────────┐           │
        └──────────────▶│  Go Submissions  │───────────┘
         (form submit)  │  (High Throughput)│
                        └──────────────────┘
```

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Rails API | 3000 | Form CRUD, Admin, Analytics |
| Go Submissions | 8080 | High-throughput form submissions |
| React Frontend | 5173 | Admin UI + Public form renderer |
| SurrealDB | 8000 | Database |

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
- settings (JSON: multi_select, max_rating, etc.)

### `submission`
- id, form_id, answers (JSON), metadata (IP, UA, duration)
- started_at, completed_at

## API Endpoints

### Rails API (`:3000`)
```
GET    /api/v1/forms              # List forms
POST   /api/v1/forms              # Create form
GET    /api/v1/forms/:slug        # Get form (public, for rendering)
PUT    /api/v1/forms/:id          # Update form
DELETE /api/v1/forms/:id          # Delete form
POST   /api/v1/forms/:id/questions     # Add question
PUT    /api/v1/forms/:id/questions/:qid # Update question
DELETE /api/v1/forms/:id/questions/:qid # Delete question
GET    /api/v1/forms/:id/submissions    # List submissions
GET    /api/v1/forms/:id/analytics      # Aggregated stats
```

### Go Submissions (`:8080`)
```
POST   /submit/:form_slug         # Submit form answers
GET    /health                     # Health check
```
