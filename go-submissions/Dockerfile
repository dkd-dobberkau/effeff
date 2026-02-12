FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY . .
RUN go mod tidy && go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /formflow-submissions ./cmd/server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates curl
COPY --from=builder /formflow-submissions /usr/local/bin/formflow-submissions

EXPOSE 8080
CMD ["formflow-submissions"]
