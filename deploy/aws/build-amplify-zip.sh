#!/usr/bin/env bash
# Builds the React site zip uploaded to AWS Amplify ("Deploy updates" > drag and drop).
#   bash deploy/aws/build-amplify-zip.sh https://<cloudfront-domain>   -> deploy/aws/out/solcacao-website.zip
# The argument is the HTTPS address of the API (the CloudFront distribution in front of Beanstalk).
set -euo pipefail
API_URL="${1:?Usage: build-amplify-zip.sh https://<api-domain>}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/deploy/aws/out"

cd "$ROOT/client"
npm ci
VITE_API_BASE_URL="$API_URL" npm run build

mkdir -p "$OUT"
rm -f "$OUT/solcacao-website.zip"
(cd dist && zip -qr "$OUT/solcacao-website.zip" .)
echo "Built $OUT/solcacao-website.zip (API: $API_URL)"
echo "In Amplify, keep the rewrite rule from deploy/aws/amplify-rewrites.json."
