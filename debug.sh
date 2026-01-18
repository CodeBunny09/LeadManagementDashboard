#!/bin/bash

BASE_URL="http://localhost:5050"   # CHANGE if needed

echo "===== /api/analytics ====="
curl -s "$BASE_URL/api/analytics" | jq .

echo ""
echo "===== /api/analytics/history (RAW) ====="
curl -s "$BASE_URL/api/analytics/history" | jq '.[0:5]'

echo ""
echo "===== COUNT ====="
curl -s "$BASE_URL/api/analytics/history" | jq 'length'

echo ""
echo "===== createdAt sanity check ====="
curl -s "$BASE_URL/api/analytics/history" | jq 'map(.createdAt) | unique[0:5]'

echo ""
echo "===== stage sanity check ====="
curl -s "$BASE_URL/api/analytics/history" | jq 'map(.stage) | unique'
