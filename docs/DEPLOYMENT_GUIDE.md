# Deployment Guide

## 1. Environment Variables
Backend requires:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `APP_URL`
- `CORS_ORIGINS`
- `DATABASE_URL`
- `REDIS_URL`

Frontend requires:
- `VITE_API_URL`

## 2. Database
Apply SQL in order:
1. `database/schema.sql`
2. `database/rls_policies.sql`
3. `database/triggers.sql`
4. `database/production_hardening.sql`

## 3. Build & Run
Use Docker Compose for production-like setup:

```bash
docker-compose up --build
```

## 4. Verification
- `/api/health`
- `/api/metrics`
- Login + role access
- Lead capture + visit + chat persistence

