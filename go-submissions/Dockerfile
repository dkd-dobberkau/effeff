FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY . .
RUN go mod tidy && go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /effeff-submissions ./cmd/server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates curl
COPY --from=builder /effeff-submissions /usr/local/bin/effeff-submissions

EXPOSE 8080
CMD ["effeff-submissions"]
