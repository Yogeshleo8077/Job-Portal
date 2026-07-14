# AI-Ready Job Portal with Job Aggregation

A full-stack job board: candidates search & apply, employers post & manage jobs and review AI-ranked applicants, and admins monitor the platform and aggregate jobs from public sources. Built for the Full Stack Engineer technical assessment.

> **Tech stack:** Next.js 15 (App Router) + Tailwind CSS · Node.js (Express + TypeScript) · PostgreSQL + Prisma · JWT auth · Docker · Swagger · AI Resume Matching (Claude).

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Demo Accounts](#demo-accounts)
- [Deliverables Mapping](#deliverables-mapping)
- [Deployment](#deployment)

---

## Features

**Module 1 — Authentication**
- Candidate & Employer registration/login, JWT (access + refresh)
- Role-based access control: `ADMIN`, `EMPLOYER`, `CANDIDATE`
- Forgot / reset password flow

**Module 2 — Job Portal**
- Employers: create / edit / delete / **close** jobs and view applicants
- Candidates: search, filter, **save**, and apply to jobs
- Rich job fields: title, company, location, work mode, employment type, salary, experience, skills, description, benefits, deadline

**Module 3 — REST APIs**
- Full CRUD + apply, applications, dashboard
- Pagination, filtering, sorting, and search on job listings

**Module 4 — Database**
- Users, Roles (enum), Companies, Jobs, Applications, SavedJobs (+ ScrapedJobs) with proper relations, constraints and indexing — see [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md)

**Module 5 & 6 — Job Scraping + Scraper API**
- Scrapes public job feeds that permit automated access (**RemoteOK**, **Arbeitnow**)
- `POST /scrape/jobs` returns jobs added, duplicates skipped, and errors
- Duplicate prevention via a unique `sourceUrl`
- **Bonus:** optional scheduled scrape every 6 hours

**Module 7 — Admin Dashboard**
- Totals (users, jobs, companies, applications), jobs scraped today, top skills / companies / locations

**Module 8 — Frontend**
- Responsive pages: Home, Login, Register, Job Listing, Job Details, Employer Dashboard, Candidate Dashboard, Admin Dashboard, Profile, Aggregated Jobs

**Bonus features implemented:** 🐳 Docker · 📚 Swagger/OpenAPI · 🤖 AI Resume Matching · plus rate limiting.

---

## Architecture

```
Job-Portal/
├── backend/               Express + TypeScript + Prisma API
│   ├── prisma/            schema.prisma + seed.ts
│   └── src/
│       ├── config/        env, prisma client, swagger, scheduler
│       ├── middleware/    auth (JWT + RBAC), validation (zod), error handler
│       ├── modules/       auth · users · jobs · applications · scraper · admin · ai
│       ├── utils/         ApiError, asyncHandler, jwt, response helpers
│       ├── app.ts         express app + routes
│       └── server.ts      entrypoint
├── frontend/              Next.js 15 (App Router) + Tailwind
│   └── src/
│       ├── app/           routes (home, auth, jobs, dashboards, profile, scraped)
│       ├── components/    Navbar, JobCard, Protected
│       └── lib/           api client, auth context, types, formatters
├── docs/                  DATABASE_SCHEMA.md + Postman collection
└── docker-compose.yml     db + backend + frontend
```

**Clean architecture:** each backend module is a `route → controller → service` slice; services own business logic and DB access, controllers stay thin, and cross-cutting concerns (auth, validation, errors) live in middleware. The frontend keeps all network access behind a single typed `api()` client and an `AuthProvider`.

---

## Quick Start (Docker)

Requires Docker + Docker Compose.

```bash
git clone <your-repo-url>
cd Job-Portal
cp .env.example .env            # set JWT secrets (and optionally ANTHROPIC_API_KEY)

docker compose up --build       # starts db, backend, frontend
```

Then, in another terminal, run the DB migration + seed once:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run db:seed
```

- Frontend → http://localhost:3000
- API      → http://localhost:4000/api
- Swagger  → http://localhost:4000/api/docs

---

## Local Development

Requires Node.js 18+ and a running PostgreSQL (or `docker compose up db`).

### Backend
```bash
cd backend
cp .env.example .env            # point DATABASE_URL at your Postgres
npm install
npx prisma migrate dev          # create tables
npm run db:seed                 # demo users + jobs
npm run dev                     # http://localhost:4000/api
```

### Frontend
```bash
cd frontend
cp .env.example .env            # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev                     # http://localhost:3000
```

---

## Environment Variables

**Backend** (`backend/.env`)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | token signing |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | token lifetimes (default 15m / 7d) |
| `CORS_ORIGIN` | allowed frontend origin(s), comma-separated |
| `ANTHROPIC_API_KEY` | optional — enables Claude AI resume matching (falls back to a keyword heuristic when unset) |
| `ANTHROPIC_MODEL` | default `claude-opus-4-8` |
| `SCRAPER_ENABLE_CRON` | `true` to scrape every 6 hours |

**Frontend** (`frontend/.env`)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | backend API base URL, including `/api` |

---

## API Overview

Base URL: `/api`. Full interactive docs at `/api/docs` (Swagger).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register candidate/employer |
| POST | `/auth/login` | — | Login → tokens |
| POST | `/auth/refresh` | — | Refresh access token |
| POST | `/auth/forgot-password` · `/auth/reset-password` | — | Password reset |
| GET/PUT | `/users/me` | ✔ | Get / update profile |
| GET | `/jobs` | — | List (pagination, filter, sort, search) |
| GET | `/jobs/:id` | — | Job details |
| POST | `/jobs` | employer/admin | Create job |
| PUT/DELETE | `/jobs/:id` | owner | Update / delete job |
| PATCH | `/jobs/:id/close` | owner | Close job |
| GET | `/jobs/:id/applicants` | owner | List applicants (AI-ranked) |
| POST | `/jobs/:id/apply` | candidate | Apply (+ AI match) |
| POST/DELETE | `/jobs/:id/save` | candidate | Save / unsave |
| GET | `/jobs/saved/list` | candidate | Saved jobs |
| GET | `/applications` | candidate | My applications |
| PATCH | `/applications/:id/status` | owner | Update applicant status |
| POST | `/scrape/jobs` | admin | Run scraper |
| GET | `/scrape/jobs` | — | List scraped jobs |
| GET | `/dashboard` | admin | Admin stats |
| POST | `/ai/match` | ✔ | AI resume match score |

A ready-to-import **Postman collection** is in [`docs/JobPortal.postman_collection.json`](docs/JobPortal.postman_collection.json) (the Login request auto-saves the token).

---

## Demo Accounts

Created by the seed (`npm run db:seed`). Password for all: **`Password@123`**

| Role | Email |
|---|---|
| Admin | `admin@jobportal.dev` |
| Employer | `employer@jobportal.dev` |
| Candidate | `candidate@jobportal.dev` |

---

## Deliverables Mapping

| Deliverable | Where |
|---|---|
| GitHub Repository | this repo |
| Live Deployment URL | see [Deployment](#deployment) |
| Database Schema | [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) + `backend/prisma/schema.prisma` |
| API Documentation | Swagger at `/api/docs` |
| Postman Collection | [`docs/JobPortal.postman_collection.json`](docs/JobPortal.postman_collection.json) |
| README | this file |

---

## Deployment

- **Frontend → Vercel:** import `frontend/`, set `NEXT_PUBLIC_API_URL` to your deployed API URL.
- **Backend + DB → Render / Railway:** deploy `backend/` (Dockerfile provided) with a managed PostgreSQL; set env vars from the table above, then run `npx prisma migrate deploy` and `npm run db:seed`.
- **All-in-one:** `docker compose up --build` runs the whole stack locally or on any Docker host.

## AI Resume Matching

When a candidate applies with resume text, the backend scores their fit against the job via Claude (`/ai/match` and inline at apply time). The score and a short assessment are stored on the application and surfaced to employers, who see applicants ranked by match score. **No API key? It still works** — the service falls back to a deterministic skill-overlap heuristic, so the feature never blocks an application.
