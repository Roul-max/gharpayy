# Gharpayy Platform

Gharpayy is a scalable CRM and marketplace platform for Paying Guest (PG) accommodations.

## Architecture

The platform consists of three main layers:
1. **Public Marketplace**: Customer-facing website to search and reserve PG beds.
2. **Internal CRM**: Used by sales agents and managers to manage leads, visits, and bookings.
3. **Owner Portal**: Allows property owners to manage their properties and view bookings.

See `docs/architecture.md` for more details.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Router, TanStack Query, Recharts, Leaflet, dnd-kit
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (Supabase compatible)

## Project Structure

```
root/
├── frontend/        # React frontend application
├── backend/         # Express.js backend API
├── database/        # SQL schema, RLS policies, and triggers
├── docs/            # Architecture documentation
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (Frontend + Backend):
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Start production server:
   ```bash
   npm start
   ```

### Database Setup
Run the SQL scripts in the `database/` folder in the following order:
1. `schema.sql`
2. `rls_policies.sql`
3. `triggers.sql`
