**Observability Setup**

**Frontend (Sentry)**
1. Set `VITE_SENTRY_DSN` in `frontend/.env`.
2. Optional: adjust `VITE_SENTRY_TRACES_SAMPLE_RATE`.
3. Verify events appear in Sentry dashboard.

**Backend (Sentry)**
1. Set `SENTRY_DSN` in `backend/src/.env`.
2. Optional: adjust `SENTRY_TRACES_SAMPLE_RATE`.
3. Verify errors and traces in Sentry dashboard.

**Structured Logs**
1. Backend logs already emit JSON via `observability/logger.ts`.
2. Ship logs to your aggregator (CloudWatch, Datadog, Grafana Loki).
