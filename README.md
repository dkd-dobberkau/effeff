# FormFlow – Open Source Typeform Clone

A modern, self-hosted form builder with a Typeform-inspired UX.

## Architecture

- **Rails API** (`:3000`) – Form CRUD, admin, analytics
- **Go Submissions** (`:8080`) – High-throughput form submission handler
- **React Frontend** (`:5173`) – Admin UI and public form renderer
- **SurrealDB** (`:8000`) – Multi-model database

## Quick Start

```bash
# Clone and start all services
docker compose up --build

# Initialize the database schema
docker compose exec surrealdb /bin/sh -c \
  "curl -X POST 'http://localhost:8000/import' \
    -H 'surreal-ns: formflow' -H 'surreal-db: main' \
    -u 'root:formflow_secret' \
    --data-binary @/docker/schema.surql"

# Or use the init script
chmod +x docker/init-db.sh
docker compose exec rails-api bash /docker/init-db.sh
```

Services will be available at:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Rails API | http://localhost:3000 |
| Go Submissions | http://localhost:8080 |
| SurrealDB | http://localhost:8000 |

## API Examples

### Create a form
```bash
curl -X POST http://localhost:3000/api/v1/forms \
  -H "Content-Type: application/json" \
  -d '{
    "form": {
      "title": "Customer Feedback",
      "description": "Help us improve our service"
    }
  }'
```

### Add a question
```bash
curl -X POST http://localhost:3000/api/v1/forms/FORM_ID/questions \
  -H "Content-Type: application/json" \
  -d '{
    "question": {
      "type": "multiple_choice",
      "title": "How did you hear about us?",
      "required": true,
      "options": [
        {"key": "A", "label": "Social Media"},
        {"key": "B", "label": "Friend"},
        {"key": "C", "label": "Search Engine"}
      ]
    }
  }'
```

### Submit a form (via Go service)
```bash
curl -X POST http://localhost:8080/submit/customer-feedback-abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"question_id": "question:xxx", "value": "A"}
    ],
    "metadata": {
      "duration_seconds": 45
    }
  }'
```

### Get analytics
```bash
curl http://localhost:3000/api/v1/forms/FORM_ID/analytics
```

## Project Structure

```
formflow/
├── docker-compose.yml
├── docker/
│   ├── schema.surql          # SurrealDB schema + seed data
│   └── init-db.sh            # DB initialization script
├── rails-api/                # Rails 7 API
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   │   ├── forms_controller.rb
│   │   │   └── questions_controller.rb
│   │   └── models/
│   │       ├── form.rb
│   │       ├── question.rb
│   │       └── submission.rb
│   ├── config/
│   │   ├── routes.rb
│   │   └── initializers/
│   │       ├── cors.rb
│   │       └── surreal.rb
│   └── lib/surreal_client.rb
├── go-submissions/           # Go submission service
│   ├── cmd/server/main.go
│   └── internal/
│       ├── handlers/submit.go
│       ├── models/models.go
│       ├── store/surreal.go
│       └── validator/validator.go
├── frontend-admin/           # React admin + form renderer
│   └── src/
│       └── api/client.js
└── docs/
    └── ARCHITECTURE.md
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Database | SurrealDB v2.1 |
| API | Ruby on Rails 7.1 (API mode) |
| Submissions | Go 1.22 + Chi router |
| Frontend | React 18 + Vite |
| Containerization | Docker Compose |

## Development

Each service can be developed independently:

```bash
# Rails only
cd rails-api && bundle exec rails server

# Go only
cd go-submissions && go run ./cmd/server

# Frontend only
cd frontend-admin && npm run dev
```

## License

MIT
