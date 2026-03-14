**Backup & Restore Runbook**

**Goal**
Ensure data safety and recoverability for production incidents.

**Supabase Backup Plan**
1. Enable daily automated backups in Supabase (Project Settings → Database → Backups).
2. Set retention policy (minimum 7–14 days recommended).
3. For critical releases, take a manual backup before deployment.

**Point-in-Time Recovery (PITR)**
1. If PITR is enabled, note the last known good timestamp.
2. Use Supabase support tools to restore to a point in time.

**Manual Export (Fallback)**
1. Use `pg_dump` from a secured machine:
```bash
pg_dump --format=custom --no-owner --no-privileges \
  --host=<db-host> --port=5432 --username=<db-user> \
  --file=backup.dump <db-name>
```
2. Store backups in a private bucket with restricted access.

**Restore Procedure**
1. Create a fresh database (or restore into a staging clone).
2. Restore with:
```bash
pg_restore --no-owner --no-privileges --clean --if-exists \
  --host=<db-host> --port=5432 --username=<db-user> \
  --dbname=<db-name> backup.dump
```
3. Run smoke tests:
   - Public: property list + detail
   - CRM: lead list + detail
   - Payments: create intent + confirm (test mode)

**Verification Checklist**
1. RLS policies still active (`pg_policies`).
2. Cron jobs exist (`cron.job`).
3. Storage buckets present (property-images, owner-documents, user-avatars).

**RTO/RPO Targets**
1. RTO: 2–4 hours
2. RPO: 24 hours (or lower if PITR enabled)
