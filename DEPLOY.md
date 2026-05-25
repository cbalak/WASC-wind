# WASC cPanel Deployment Guide

## Prerequisites

- Namecheap shared hosting with cPanel
- Node.js 22 enabled in cPanel
- PostgreSQL database created
- GitHub repo: https://github.com/cbalak/WASC-wind.git

## cPanel Node.js App Settings

In **cPanel -> Setup Node.js App**, configure:

```
Application root: wasc.wasms.vip
Application URL: wasc.wasms.vip
Application startup file: app.js
Node version: 22
Application mode: production
```

## Environment Variables (in cPanel)

```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://wasc.wasms.vip
DATABASE_URL=postgresql://wasmngmn_wascuser:YOUR_PASSWORD@localhost:5432/wasmngmn_wascdb?schema=public
JWT_SECRET=your-random-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
ENCRYPTION_KEY=your-32-byte-encryption-key
```

## Deployment Steps

### Option 1: Run the deployment script

In cPanel Terminal:

```bash
cd /home/wasmngmn/wasc.wasms.vip
chmod +x deploy-cpanel.sh
./deploy-cpanel.sh
```

### Option 2: Manual deployment

```bash
# 1. Activate Node 22
source /home/wasmngmn/nodevenv/wasc.wasms.vip/22/bin/activate
cd /home/wasmngmn/wasc.wasms.vip

# 2. Pull latest code
git fetch origin main
git reset --hard origin/main

# 3. Install dependencies
rm -rf node_modules
npm install --include=dev --ignore-scripts

# 4. Generate Prisma client
cd apps/backend
export PRISMA_SCHEMA_ENGINE_TYPE=binary
export PRISMA_CLI_QUERY_ENGINE_TYPE=binary
../../node_modules/.bin/prisma generate --schema=prisma/schema.prisma
cd ../..

# 5. Build all packages
npm run build -w packages/shared
npm run build -w apps/web
npm run build -w apps/backend

# 6. Run migrations
cd apps/backend
export PRISMA_SCHEMA_ENGINE_TYPE=binary
export PRISMA_CLI_QUERY_ENGINE_TYPE=binary
../../node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

# 7. Seed database
npm run db:seed
```

### 8. Restart the app

In cPanel -> Setup Node.js App, click **Restart**.

## Verification

Test these URLs:

- `https://wasc.wasms.vip/health` - Should return JSON with status "ok"
- `https://wasc.wasms.vip/` - Should show the WASC React app

## Troubleshooting

### "It works!" page still shows
- Verify Application startup file is `app.js` (not server.js or index.js)
- Check that `apps/backend/dist/index.js` exists
- Check `stderr.log` in cPanel File Manager

### Build failures
- Ensure Node 22 is active: `node -v` should show v22.x.x
- Check TypeScript compilation: `npm run build -w packages/shared` first

### Database errors
- Verify DATABASE_URL is set correctly in cPanel environment variables
- Check Prisma can connect: `npx prisma db pull` (test connection)

### 500 errors after deployment
- Check `stderr.log` in cPanel File Manager for errors
- Ensure all environment variables are set
- Verify database migrations ran successfully
