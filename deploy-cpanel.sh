#!/bin/bash
# WASC cPanel Deployment Script
# Run this in cPanel Terminal

set -e

echo "=== WASC cPanel Deployment ==="

# Activate Node 22
source /home/wasmngmn/nodevenv/wasc.wasms.vip/22/bin/activate || {
    echo "ERROR: Could not activate Node 22 virtualenv"
    echo "Check: ls /home/wasmngmn/nodevenv/wasc.wasms.vip/"
    exit 1
}

cd /home/wasmngmn/wasc.wasms.vip

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Pull latest code
echo ""
echo "=== Pulling latest code from GitHub ==="
git fetch origin main
git reset --hard origin/main

# Clean and reinstall
echo ""
echo "=== Installing dependencies ==="
rm -rf node_modules
npm install --include=dev --ignore-scripts

# Generate Prisma client
echo ""
echo "=== Generating Prisma client ==="
cd apps/backend
export PRISMA_SCHEMA_ENGINE_TYPE=binary
export PRISMA_CLI_QUERY_ENGINE_TYPE=binary
../../node_modules/.bin/prisma generate --schema=prisma/schema.prisma
cd ../..

# Build packages
echo ""
echo "=== Building packages ==="
npm run build -w packages/shared
npm run build -w apps/web
npm run build -w apps/backend

# Verify builds
echo ""
echo "=== Verifying builds ==="
if [ ! -f "apps/web/dist/index.html" ]; then
    echo "ERROR: Frontend build failed - apps/web/dist/index.html not found"
    exit 1
fi
if [ ! -f "apps/backend/dist/index.js" ]; then
    echo "ERROR: Backend build failed - apps/backend/dist/index.js not found"
    exit 1
fi
echo "Builds verified successfully"

# Run database migrations
echo ""
echo "=== Running database migrations ==="
cd apps/backend
export PRISMA_SCHEMA_ENGINE_TYPE=binary
export PRISMA_CLI_QUERY_ENGINE_TYPE=binary
../../node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

# Seed database
echo ""
echo "=== Seeding database ==="
export DATABASE_URL="${DATABASE_URL}"
npm run db:seed

echo ""
echo "=== Deployment complete! ==="
echo ""
echo "IMPORTANT: Go to cPanel -> Setup Node.js App and verify:"
echo "  - Application startup file: app.js"
echo "  - Then click 'Restart'"
echo ""
echo "Test URLs:"
echo "  https://wasc.wasms.vip/health"
echo "  https://wasc.wasms.vip/"
