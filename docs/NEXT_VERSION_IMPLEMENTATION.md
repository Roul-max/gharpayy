# Gharpayy Next Version Implementation (March 2026)

This repository has been upgraded from a demo-oriented baseline toward production operations for:
- 30+ internal CRM users
- 100+ inventory owners
- 10,000+ daily marketplace visitors

## 1) What Was Implemented

### Backend API Expansion
- Added authenticated operations APIs:
  - `GET/POST /api/visits`
  - `PATCH /api/visits/:id/outcome`
  - `GET /api/bookings`
  - `GET/POST /api/properties`
  - `GET /api/inventory`
  - `GET/POST /api/owners`
  - `GET /api/effort`
- Added public ingestion APIs:
  - `POST /api/public/capture`
  - `POST /api/public/visit-request`
  - `POST /api/public/chat`

### Security/RBAC
- Strengthened auth middleware to:
  - verify Supabase token with `supabase.auth.getUser(token)`
  - fallback to JWT verification with `SUPABASE_JWT_SECRET`
  - load all roles from `user_roles` and enforce role checks
- Added `database/production_hardening.sql` with:
  - `app_role` enum
  - `has_role` and `has_any_role` helper functions
  - tighter RLS on reservations/soft locks/messages/conversations/payment tables
  - critical query indexes
  - pg_cron scheduling templates

### Frontend Route + Module Coverage
- Added protected app routes for:
  - `/dashboard`, `/leads`, `/pipeline`, `/visits`, `/bookings`,
  - `/analytics`, `/historical`, `/owners`, `/inventory`,
  - `/availability`, `/effort`, `/matching`, `/zones`, `/settings`
- Added simple auth gate at `/auth` for protected routes.
- Extended CRM shell routing and added operational module pages:
  - Visits, Bookings, Inventory, Owners, Effort
- Added public lead capture UI:
  - `/capture` now sends data to `/api/public/capture`
- Added `/explore` route alias.

## 2) Files Added/Updated

### Added
- `backend/src/services/operationsService.ts`
- `backend/src/controllers/operationsController.ts`
- `backend/src/routes/operations.ts`
- `backend/src/routes/public.ts`
- `frontend/src/hooks/useOperations.ts`
- `frontend/src/pages/crm/OperationsModules.tsx`
- `frontend/src/pages/marketplace/Capture.tsx`
- `database/production_hardening.sql`
- `docs/NEXT_VERSION_IMPLEMENTATION.md`

### Updated
- `backend/src/routes/index.ts`
- `backend/src/middleware/auth.ts`
- `frontend/src/services/api.ts`
- `frontend/src/pages/crm/index.tsx`
- `frontend/src/pages/marketplace/index.tsx`
- `frontend/src/App.tsx`

## 3) What Is Still Required Before Full Production

1. Replace dev auth fallback with full Supabase Auth flows for agents/managers/owners.
2. Apply SQL from `database/production_hardening.sql` in controlled migration environments.
3. Implement real payment workflow (`reservations` -> gateway callback -> `bookings`).
4. Add observability dashboards for logs/metrics (Sentry + API metrics).
5. Add load testing and DB connection pooling validation for 10k+ daily traffic.

## 4) Rollout Sequence

1. Deploy backend route changes.
2. Apply DB hardening migration in staging.
3. Validate role access matrix (admin/manager/agent/owner).
4. Test public ingestion endpoints from marketplace forms.
5. Run UAT with sales + inventory operations team.
6. Roll out to production with feature flags for public chat/visit request.

## 5) Seeded User IDs (Dev/Test)

Use these seeded user IDs in local testing:

- Admin: `00000000-0000-0000-0000-000000000001`
- Manager: `00000000-0000-0000-0000-000000000002`
- Agent: `00000000-0000-0000-0000-000000000003`
- Owner: `00000000-0000-0000-0000-000000000004`
