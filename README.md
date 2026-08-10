# Capacity Planner

Capacity Planning MVP for a consulting company. Managers can see planned vs actual utilization, free capacity, and overallocation across a six-week planning horizon.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod (planned) |
| Charts | Recharts (planned) |
| Auth | Local JWT auth with RBAC (planned) |

## Project structure

```text
capacity-planner/
├── frontend/                 # Next.js App Router UI
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── tailwind.config.ts
│   └── postcss.config.mjs
├── backend/                  # Express API + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── src/
│       ├── config/
│       ├── db/
│       ├── lib/
│       └── index.ts
├── docker-compose.yml        # Local PostgreSQL
├── package.json              # npm workspaces root
└── README.md
```

## Features (MVP)

- Employee and project master data
- Six-week capacity planning (Mon–Fri grid)
- Actual time entry by category
- Absence management (reduces available capacity)
- Shared backend capacity calculation engine
- Management dashboard KPIs, chart, heatmap, free resources
- Roles: Admin/Planner, Employee, Management (multi-role supported)

Capacity KPIs are always calculated from source data (plans, absences, holidays, contracts). They are not stored as manual summary values.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (for PostgreSQL)

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd capacity-planner
npm install
```

### 2. Configure environment

```bash
copy backend\.env.example backend\.env
```

Default connection (matches Docker Compose):

```env
DATABASE_URL="postgresql://capacity:capacity123@localhost:5433/capacity_planner?schema=public"
PORT=4000
NODE_ENV=development
```

> Postgres is published on host port **5433** so it does not conflict with a local Postgres on `5432`.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

Check the container:

```bash
docker compose ps
```

### 4. Run migrations and seed

From the repo root:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:check
```

Seed users:

| Email | Password | Roles |
| --- | --- | --- |
| `admin@capacity.local` | `admin123` | Admin / Planner |
| `director@capacity.local` | `director123` | Management + Admin / Planner |
| `jamie@capacity.local` | `employee123` | Employee |

### 5. Start the apps

API (default `http://localhost:4000`):

```bash
npm run dev:api
```

Web (default `http://localhost:3000`):

```bash
npm run dev:web
```

Health check:

```text
GET http://localhost:4000/health
```

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev:web` | Start Next.js frontend |
| `npm run dev:api` | Start Express API (watch mode) |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Apply migrations |
| `npm run db:migrate:dev` | Create/apply migrations in development |
| `npm run db:seed` | Seed roles, users, sample master data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset DB, re-run migrations + seed |
| `npm run db:check` | Verify DB connection and row counts |
| `npm run typecheck:api` | Typecheck backend |

## Database credentials

| Field | Value |
| --- | --- |
| Host | `localhost` |
| Port | `5433` |
| User | `capacity` |
| Password | `capacity123` |
| Database | `capacity_planner` |

This is **PostgreSQL**, not MySQL. Use Prisma Studio, pgAdmin, or DBeaver — not phpMyAdmin.

## Planned frontend routes

- `/login`
- `/dashboard`
- `/planning`
- `/time-entries`
- `/absences`
- `/employees`
- `/employees/[id]`
- `/projects`
- `/projects/[id]`

## Capacity formulas

- **Daily target** = weekly contract hours ÷ working days
- **Available capacity** = contract capacity − absences − public holidays
- **Planned utilization** = planned hours ÷ available capacity × 100
- **Free capacity** = available capacity − planned hours
- **Overallocated hours** = max(0, planned hours − available capacity)

## Out of scope

CRM pipeline, skills matching, revenue/cost/margin, invoicing, AI recommendations, mobile app, external integrations, and complex approval workflows are not part of this MVP.

## Troubleshooting

**P1000 authentication failed**  
Confirm `backend/.env` matches Docker Compose user/password, and that you are connecting to port `5433`.

**Port 5432 already allocated**  
Expected if another Postgres is installed locally. This project intentionally uses `5433`.

**Docker daemon not running**  
Start Docker Desktop, then run `docker compose up -d` again.

**Migration syntax error near BOM**  
Ensure `backend/prisma/migrations/**/migration.sql` is saved as UTF-8 without BOM.
