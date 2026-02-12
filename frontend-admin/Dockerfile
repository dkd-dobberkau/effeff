# ─── Build stage ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

ARG VITE_RAILS_API_URL=""
ARG VITE_GO_SUBMISSIONS_URL=""
RUN npm run build

# ─── Production stage ─────────────────────────────────
FROM nginx:alpine

RUN adduser -D -u 1000 appuser

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R appuser:appuser /var/cache/nginx /var/log/nginx /usr/share/nginx/html \
    && touch /var/run/nginx.pid && chown appuser:appuser /var/run/nginx.pid

USER appuser

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
