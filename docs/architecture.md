# Gharpayy Architecture

## System Overview

The Gharpayy platform is designed to handle:
- 30+ internal CRM team members
- 100+ property owners contributing inventory
- 10,000+ daily marketplace visitors

## Tech Stack

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast build and HMR
- **TailwindCSS** for styling
- **TanStack Query** for data fetching and caching
- **React Router** for navigation
- **Leaflet + React Leaflet** for maps
- **Framer Motion** for animations
- **Recharts** for analytics dashboards
- **dnd-kit** for Kanban board drag-and-drop

### Backend
- **Node.js** with **Express.js** and **TypeScript**
- **Cron Jobs** for background tasks (soft locks, lead scoring, reminders)

### Database
- **PostgreSQL** (Supabase compatible)
- **Row Level Security (RLS)** for role-based access control
- **Triggers** for automated data updates (e.g., bed status, last activity)

## Core Modules

1. **Public Marketplace**:
   - Landing page with search filters (city, area, gender, budget).
   - Property page with photos, amenities, rooms, beds, and map view.
   - Reservation flow with 10-minute soft locks.

2. **Internal CRM**:
   - Dashboard with KPIs (Total leads, Conversion rate, Visits scheduled, Bookings closed).
   - Lead Management with CRUD operations, lead scoring, and activity logs.
   - Pipeline Kanban board with drag-and-drop stages.
   - Visit Management to schedule visits and record outcomes.

3. **Owner Portal**:
   - View properties and confirm room availability.
   - View bookings and effort metrics.

## Database Design

The database schema includes tables for:
- `profiles`, `agents`, `owners`, `zones`, `team_queues`
- `leads`, `visits`, `conversations`, `messages`
- `properties`, `rooms`, `beds`
- `reservations`, `soft_locks`, `bookings`, `payment_transactions`
- `user_roles`

Role-based access control is implemented using PostgreSQL Row Level Security (RLS) policies, restricting access based on the user's role (admin, manager, agent, owner).

## Scalability and Security

- **Pagination and Query Indexing**: Implemented in the database and API.
- **Caching**: TanStack Query is used on the frontend to cache API responses.
- **Error Handling**: Global React Error Boundary and centralized backend error middleware.
- **Security**: JWT verification, RBAC via RLS, input validation, and API error handling.
