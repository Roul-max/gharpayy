# Security Model

## RBAC Roles
- `admin`
- `manager`
- `agent`
- `owner`

## API Layer
- JWT/Supabase auth (`backend/src/middleware/auth.ts`)
- Role enforcement (`backend/src/middleware/requireRole.ts`)

## Database Layer
- RLS policies defined in `database/rls_policies.sql`
- Hardening rules in `database/production_hardening.sql`

## Public Endpoints
- Rate-limited and CAPTCHA-protected
- Idempotency keys for write endpoints

