#!/usr/bin/env bash
# Builds the zip uploaded to AWS Elastic Beanstalk ("Upload and deploy").
#   bash deploy/aws/build-beanstalk-zip.sh        -> deploy/aws/out/solcacao-api-beanstalk.zip
# The zip holds the Express API plus the client files the API reads at runtime
# (translations, product seed data, public images). Secrets are NOT included:
# set MONGO_CONNECTION_STRING, JWT_SECRET, BUCKET_*, ACCESS_KEY, SECRET_ACCESS_KEY
# and the SMTP settings in Beanstalk > Configuration > Environment properties.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/deploy/aws/out"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# 1. API code (no node_modules, no .env, no tests)
mkdir -p "$STAGE/backend"
(cd "$ROOT/backend" && tar cf - --exclude=node_modules --exclude=.env --exclude='*.test.js' .) | (cd "$STAGE/backend" && tar xf -)

# 2. Client files the API serves or reads
mkdir -p "$STAGE/client/src/i18n" "$STAGE/client/src/data"
cp -r "$ROOT/client/src/i18n/locales" "$STAGE/client/src/i18n/"
cp "$ROOT/client/src/data/products.js" "$STAGE/client/src/data/"
cp -r "$ROOT/client/public" "$STAGE/client/"

# 3. Beanstalk settings (PORT 8080, nginx upload limit 20 MB)
cp -r "$ROOT/deploy/aws/beanstalk/.ebextensions" "$ROOT/deploy/aws/beanstalk/.platform" "$STAGE/"

# 4. Root package.json: Beanstalk runs "npm install" and "npm start" at the zip root.
#    Same dependencies as backend/package.json, minus Prisma (not used, its install step fails there).
node -e '
  const pkg = require(process.argv[1]);
  const deps = { ...pkg.dependencies };
  delete deps["@prisma/client"];
  const out = {
    name: "solcacao-api", version: "1.0.0", private: true,
    description: "SolCacao Express API for AWS Elastic Beanstalk",
    engines: { node: ">=20.19" },
    scripts: { start: "node backend/server.js", seed: "node backend/db/seed.js", "seed:catalog": "node backend/scripts/seedStudent3.js" },
    dependencies: deps,
  };
  require("fs").writeFileSync(process.argv[2], JSON.stringify(out, null, 2) + "\n");
' "$ROOT/backend/package.json" "$STAGE/package.json"

mkdir -p "$OUT"
rm -f "$OUT/solcacao-api-beanstalk.zip"
(cd "$STAGE" && zip -qr "$OUT/solcacao-api-beanstalk.zip" .)
echo "Built $OUT/solcacao-api-beanstalk.zip"
