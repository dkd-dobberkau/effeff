#!/bin/bash
set -e

echo "⏳ Waiting for SurrealDB..."
until curl -sf http://surrealdb:8000/health > /dev/null 2>&1; do
  sleep 1
done

echo "✅ SurrealDB is up. Importing schema..."
curl -s -X POST "http://surrealdb:8000/import" \
  -H "Accept: application/json" \
  -H "surreal-ns: effeff" \
  -H "surreal-db: main" \
  -u "root:effeff_secret" \
  --data-binary @/docker/schema.surql

echo "✅ Schema imported successfully."
