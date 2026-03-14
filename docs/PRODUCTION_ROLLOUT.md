# Gharpayy Production Rollout Checklist

This repository is now set up to support:
- Real auth flows
- CRM follow-ups and notifications
- Owner inventory actions
- Backend TypeScript compilation
- Route-based frontend code splitting

Use this checklist to finish production rollout.

## 1. Environment Setup

### Backend
Copy [backend/src/.env.example](/c:/Users/Rohit/Desktop/New%20folder/backend/src/.env.example) to `.env` and provide:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `APP_URL`
- `GEMINI_API_KEY`
- `NODE_ENV=production`

### Frontend
Copy [frontend/.env.example](/c:/Users/Rohit/Desktop/New%20folder/frontend/.env.example) and set:
- `VITE_API_URL`

## 2. Database Rollout

Apply SQL in this order:
1. [database/schema.sql](/c:/Users/Rohit/Desktop/New%20folder/database/schema.sql)
2. [database/rls_policies.sql](/c:/Users/Rohit/Desktop/New%20folder/database/rls_policies.sql)
3. [database/triggers.sql](/c:/Users/Rohit/Desktop/New%20folder/database/triggers.sql)
4. [database/production_hardening.sql](/c:/Users/Rohit/Desktop/New%20folder/database/production_hardening.sql)

Critical new objects:
- `follow_up_reminders`
- `notifications`
- hardened role-based policies
- performance indexes

## 3. Auth Rollout

- Create real agent, manager, admin, and owner users in Supabase Auth.
- Ensure each authenticated user has matching rows in `profiles` and `user_roles`.

## 4. Verification

Run:

```bash
# frontend
npm run build

# backend
cd backend/src
npm install
npm run build
```

Validate:
- login
- password reset
- AI website assistant replies on marketplace/property pages
- protected route access by role
- lead creation
- follow-up creation/completion
- notifications visibility
- room creation / bed creation
- owner room status confirmation
- public chat handoff to CRM inbox (via AI widget)

## 5. Pre-Go-Live

- Set up uptime monitoring on `/api/health`
- Enable error aggregation/log shipping for backend JSON logs
- Run load tests for public browse and lead capture endpoints
- Review `docs/ASSIGNMENT_SCORECARD.md` for assignment coverage
- Run UAT with CRM team and owners

## 6. Go-Live Standard

Call this production-ready only when:
- DB migrations are live
- real auth users exist
- backend env vars are configured
- both builds pass in CI
- staging UAT passes
- load testing passes
