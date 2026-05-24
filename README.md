# WhatsApp Revenue + Support Command Centre

A production-ready SaaS that transforms WhatsApp into a revenue, support, CRM and AI command centre for businesses.

## Product Promise
**"No more lost WhatsApp leads. No more forgotten follow-ups. No more messy customer chats. Your WhatsApp becomes a revenue and support machine."**

## Architecture
- **Chrome Extension**: Interface layer only. No meaningful function without backend.
- **Backend SaaS**: Brain, licence authority, AI engine, CRM sync, billing, reseller controls.
- **Official WhatsApp API**: Optional compliant async messaging layer.

## Monorepo Structure
```
apps/
  backend/     Node.js + Express + Prisma API
  web/         React + TypeScript + Tailwind Portal
  extension/   Chrome Extension Manifest V3
packages/
  shared/      Shared types and utilities
```

## Quick Start
```bash
# Install dependencies
npm install

# Set up environment
cp apps/backend/.env.example apps/backend/.env

# Run database migrations
npm run db:migrate

# Start dev servers
npm run dev
```

## Deployment
See `DEPLOYMENT.md` for production deployment instructions.

## Security
See `SECURITY.md` for security model, compliance and hardening details.
