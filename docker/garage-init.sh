#!/bin/sh
# Bootstrap Garage: assign layout, create bucket, create access key.
# Run this after the garage container is healthy.
set -e

GARAGE_ADMIN="http://garage:3903"
ADMIN_TOKEN="formflow_garage_admin_token"

echo "Waiting for Garage admin API..."
for i in $(seq 1 30); do
  if curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$GARAGE_ADMIN/v1/health" > /dev/null 2>&1; then
    echo "Garage admin API is ready."
    break
  fi
  sleep 1
done

# Get node ID
NODE_ID=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$GARAGE_ADMIN/v1/status" | python3 -c "import sys,json; print(json.load(sys.stdin)['node'])" 2>/dev/null || true)

if [ -z "$NODE_ID" ]; then
  echo "ERROR: Could not get node ID from Garage"
  exit 1
fi

echo "Node ID: $NODE_ID"

# Assign layout (zone=dc1, capacity=1GB)
echo "Assigning layout..."
curl -sf -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[{\"id\": \"$NODE_ID\", \"zone\": \"dc1\", \"capacity\": 1073741824}]" \
  "$GARAGE_ADMIN/v1/layout" || true

# Apply layout
LAYOUT_VERSION=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$GARAGE_ADMIN/v1/layout" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'] + 1)" 2>/dev/null || echo "1")
echo "Applying layout version $LAYOUT_VERSION..."
curl -sf -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"version\": $LAYOUT_VERSION}" \
  "$GARAGE_ADMIN/v1/layout/apply" || true

# Create bucket
echo "Creating bucket formflow-uploads..."
curl -sf -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"globalAlias": "formflow-uploads"}' \
  "$GARAGE_ADMIN/v1/bucket" || echo "(bucket may already exist)"

# Get bucket ID
BUCKET_ID=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$GARAGE_ADMIN/v1/bucket?globalAlias=formflow-uploads" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)
echo "Bucket ID: $BUCKET_ID"

# Create access key
echo "Creating access key..."
KEY_RESPONSE=$(curl -sf -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "formflow-app"}' \
  "$GARAGE_ADMIN/v1/key" 2>/dev/null || true)

if [ -n "$KEY_RESPONSE" ]; then
  ACCESS_KEY=$(echo "$KEY_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessKeyId'])" 2>/dev/null || true)
  SECRET_KEY=$(echo "$KEY_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['secretAccessKey'])" 2>/dev/null || true)
  KEY_ID=$(echo "$KEY_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)

  if [ -n "$BUCKET_ID" ] && [ -n "$KEY_ID" ]; then
    # Grant read/write on bucket
    echo "Granting bucket access..."
    curl -sf -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"bucketId\": \"$BUCKET_ID\", \"accessKeyId\": \"$KEY_ID\", \"permissions\": {\"read\": true, \"write\": true, \"owner\": true}}" \
      "$GARAGE_ADMIN/v1/bucket/allow" || true
  fi

  echo ""
  echo "============================================"
  echo "Garage S3 credentials:"
  echo "  S3_ACCESS_KEY=$ACCESS_KEY"
  echo "  S3_SECRET_KEY=$SECRET_KEY"
  echo "  S3_ENDPOINT=garage:3900"
  echo "  S3_BUCKET=formflow-uploads"
  echo "============================================"
else
  echo "(key may already exist — check garage logs)"
fi

echo "Garage init complete."
