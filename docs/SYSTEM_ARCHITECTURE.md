# System Architecture

## Overview
Gharpayy is a full-stack PG marketplace + CRM platform with a React frontend, Node/Express backend, and Supabase/Postgres data layer.

## High-Level Diagram

```mermaid
flowchart LR
  Client[Web Client] -->|HTTPS| Nginx[Nginx Gateway]
  Nginx --> Frontend[Frontend SPA]
  Nginx --> Backend[Backend API]
  Backend -->|SQL| Postgres[(Postgres)]
  Backend -->|Cache/Queues| Redis[(Redis)]
  Backend --> Supabase[Supabase Auth + Storage]
  Backend --> Sentry[Sentry / OTEL]
  Worker[Queue Workers] --> Redis
  Worker --> Postgres
```

## Layers
- Public Marketplace: search, listing, property details, lead capture.
- Internal CRM: leads, pipeline, visits, bookings, analytics.
- Owner Portal: inventory confirmation, booking visibility, effort metrics.

