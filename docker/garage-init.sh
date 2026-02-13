#!/bin/sh
# Bootstrap Garage v2: assign layout, create bucket, create access key.
# Run this after the garage container is healthy.
#
# From host:   GARAGE_ADMIN=http://localhost:3903 sh docker/garage-init.sh
# From Docker: docker compose exec rails-api sh /docker/garage-init.sh
set -e

GARAGE_ADMIN="${GARAGE_ADMIN:-http://garage:3903}"
ADMIN_TOKEN="effeff_garage_admin_token"

echo "Waiting for Garage admin API at $GARAGE_ADMIN..."
for i in $(seq 1 30); do
  if curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$GARAGE_ADMIN/v2/GetClusterHealth" > /dev/null 2>&1; then
    echo "Garage admin API is ready."
    break
  fi
  sleep 1
done

# Get node ID
NODE_ID=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$GARAGE_ADMIN/v2/GetClusterStatus" | python3 -c "import sys,json; print(json.load(sys.stdin)['nodes'][0]['id'])" 2>/dev/null || true)

if [ -z "$NODE_ID" ]; then
  echo "ERROR: Could not get node ID from Garage"
  exit 1
fi

echo "Node ID: $NODE_ID"

# Assign layout (zone=dc1, capacity=1GB)
echo "Assigning layout..."
curl -sf -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roles": [{"id":"'"$NODE_ID"'","zone":"dc1","capacity":1073741824,"tags":[]}]}' \
  "$GARAGE_ADMIN/v2/UpdateClusterLayout" > /dev/null || true

# Apply layout
LAYOUT_VERSION=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$GARAGE_ADMIN/v2/GetClusterLayout" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'] + 1)" 2>/dev/null || echo "1")
echo "Applying layout version $LAYOUT_VERSION..."
curl -sf -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"version\": $LAYOUT_VERSION}" \
  "$GARAGE_ADMIN/v2/ApplyClusterLayout" > /dev/null || true

# Create bucket
echo "Creating bucket effeff-uploads..."
BUCKET_RESP=$(curl -sf -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"globalAlias": "effeff-uploads"}' \
  "$GARAGE_ADMIN/v2/CreateBucket" 2>/dev/null || echo "")

if [ -n "$BUCKET_RESP" ]; then
  BUCKET_ID=$(echo "$BUCKET_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)
  echo "Bucket ID: $BUCKET_ID"
else
  echo "(bucket may already exist)"
  BUCKET_ID=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$GARAGE_ADMIN/v2/ListBuckets" | python3 -c "
import sys, json
for b in json.load(sys.stdin):
  if 'effeff-uploads' in b.get('globalAliases', []):
    print(b['id']); break
" 2>/dev/null || true)
  echo "Bucket ID: $BUCKET_ID"
fi

# Create access key
echo "Creating access key..."
KEY_RESPONSE=$(curl -sf -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "effeff-app"}' \
  "$GARAGE_ADMIN/v2/CreateKey" 2>/dev/null || true)

if [ -n "$KEY_RESPONSE" ]; then
  ACCESS_KEY=$(echo "$KEY_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessKeyId'])" 2>/dev/null || true)
  SECRET_KEY=$(echo "$KEY_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['secretAccessKey'])" 2>/dev/null || true)

  if [ -n "$BUCKET_ID" ] && [ -n "$ACCESS_KEY" ]; then
    echo "Granting bucket access..."
    curl -sf -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"bucketId":"'"$BUCKET_ID"'","accessKeyId":"'"$ACCESS_KEY"'","permissions":{"read":true,"write":true,"owner":true}}' \
      "$GARAGE_ADMIN/v2/AllowBucketKey" > /dev/null || true
  fi

  echo ""
  echo "============================================"
  echo "Garage S3 credentials:"
  echo "  S3_ACCESS_KEY=$ACCESS_KEY"
  echo "  S3_SECRET_KEY=$SECRET_KEY"
  echo "  S3_ENDPOINT=garage:3900"
  echo "  S3_BUCKET=effeff-uploads"
  echo "============================================"
  echo ""
  echo "Add these to go-submissions environment in docker-compose.yml,"
  echo "then run: docker compose restart go-submissions"
else
  echo "(key may already exist — check garage logs)"
fi

echo "Garage init complete."
