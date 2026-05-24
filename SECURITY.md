# Security Model

## Core Principles
1. Extension is interface only - all logic server-side
2. Reverse engineering yields nothing without valid tenant licence
3. Every request validated: tenant licence, signed token, session, feature flag
4. No secrets in extension code
5. All CRM tokens encrypted at rest

## Authentication
- Short-lived JWT (15 min access, 7 day refresh)
- Refresh token rotation
- MFA for admin and reseller roles
- Device/session management

## Authorization
- RBAC: super_admin, admin, reseller, manager, agent, viewer
- Multi-tenant isolation at database level
- Row-level security policies

## Data Protection
- AES-256 encryption for tokens and PII
- Encrypted token storage for CRM connectors
- No raw CRM credentials in logs
- Data retention controls per tenant

## AI Safety
- Prompt injection filtering
- AI output validation
- Confidence scoring
- Human approval gates
- Audit trail for all AI actions
- Forbidden topic detection
- Rate limiting per tenant

## Compliance
- POPIA/GDPR ready
- Opt-in/opt-out support
- Data export/delete
- Privacy policy and ToS
- Audit logs retention: 1 year

## Rate Limiting
- 100 req/min per user
- 1000 req/min per tenant
- AI actions: tier-based monthly limits
- CRM sync: configurable batch sizes
