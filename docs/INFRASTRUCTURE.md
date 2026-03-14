# Infrastructure

## Services
- `frontend`: React SPA built with Vite.
- `backend`: Express API with Supabase + Postgres access.
- `postgres`: Primary datastore for app tables and analytics.
- `redis`: Cache and queue backend (BullMQ).
- `worker`: Background job processor.
- `nginx`: API gateway and static file proxy.

## Observability
- Sentry error tracking
- OpenTelemetry traces
- `/api/metrics` endpoint for runtime health

