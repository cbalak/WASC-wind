# Deployment Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis (optional, for caching and rate limiting)
- OpenAI API key

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://user:pass@localhost:5432/wacc?schema=public"
JWT_SECRET="generate-strong-secret"
JWT_REFRESH_SECRET="generate-strong-refresh-secret"
OPENAI_API_KEY="sk-..."
ENCRYPTION_KEY="32-byte-encryption-key"
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://app.yourdomain.com
```

## Steps
1. Provision PostgreSQL database
2. Run migrations: `npx prisma migrate deploy`
3. Seed default plans: `npm run db:seed`
4. Build frontend: `cd apps/web && npm run build`
5. Deploy backend with PM2/Docker
6. Serve frontend from CDN or embed in backend
7. Publish Chrome extension to Web Store
8. Configure DNS and SSL

## Production Checklist
- [ ] HTTPS only
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Audit logging active
- [ ] Database backups
- [ ] Error monitoring (Sentry)
- [ ] Health check endpoint
- [ ] Graceful shutdown
