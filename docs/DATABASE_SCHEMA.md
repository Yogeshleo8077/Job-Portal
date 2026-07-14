# Database Schema

PostgreSQL, modeled with Prisma. Source of truth: [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).

## Entity-Relationship Overview

```
User ──────────┐
 │ (postedBy)   │ (candidate)
 ▼              ▼
Job          Application ──► Job
 ▲              ▲
 │ (company)    │
Company      SavedJob ──► Job

ScrapedJob  (standalone — aggregated listings)
```

## Tables

### User
| Column | Type | Notes |
|---|---|---|
| id | cuid (PK) | |
| email | string | **unique**, indexed |
| passwordHash | string | bcrypt (12 rounds) |
| name | string | |
| role | enum(`ADMIN`,`EMPLOYER`,`CANDIDATE`) | indexed, default `CANDIDATE` |
| headline, bio, location | string? | candidate profile |
| skills | string[] | candidate profile |
| resumeUrl | string? | |
| resetToken, resetTokenExpiry | string?/datetime? | forgot-password flow |
| companyId | FK → Company | nullable (employers) |

Relations: `postedJobs` (1:N Job), `applications` (1:N Application), `savedJobs` (1:N SavedJob), `company` (N:1 Company).

### Company
| Column | Type | Notes |
|---|---|---|
| id | cuid (PK) | |
| name | string | **unique**, indexed |
| website, description, logoUrl, location | string? | |

Relations: `employees` (1:N User), `jobs` (1:N Job).

### Job
| Column | Type | Notes |
|---|---|---|
| id | cuid (PK) | |
| title, description, location | string | |
| workMode | enum(`ONSITE`,`REMOTE`,`HYBRID`) | indexed |
| employmentType | enum(`FULL_TIME`,`PART_TIME`,`CONTRACT`,`INTERNSHIP`,`TEMPORARY`) | indexed |
| salaryMin, salaryMax, experienceMin, experienceMax | int? | |
| currency | string | default `INR` |
| skills, benefits | string[] | |
| deadline | datetime? | |
| status | enum(`OPEN`,`CLOSED`,`DRAFT`) | indexed, default `OPEN` |
| companyId | FK → Company | **onDelete: Cascade**, indexed |
| postedById | FK → User | **onDelete: Cascade**, indexed |
| createdAt | datetime | indexed (for sorting) |

Relations: `applications` (1:N), `savedBy` (1:N SavedJob).

### Application
| Column | Type | Notes |
|---|---|---|
| id | cuid (PK) | |
| status | enum(`APPLIED`,`REVIEWING`,`SHORTLISTED`,`REJECTED`,`HIRED`) | indexed, default `APPLIED` |
| coverLetter, resumeUrl | string? | |
| matchScore | int? | AI resume match score (0–100) |
| matchNotes | string? | AI assessment summary |
| jobId | FK → Job | **onDelete: Cascade**, indexed |
| candidateId | FK → User | **onDelete: Cascade**, indexed |

**Constraint:** `@@unique([jobId, candidateId])` — a candidate can apply to a job only once.

### SavedJob
| Column | Type | Notes |
|---|---|---|
| id | cuid (PK) | |
| jobId | FK → Job | **onDelete: Cascade** |
| candidateId | FK → User | **onDelete: Cascade**, indexed |

**Constraint:** `@@unique([jobId, candidateId])`.

### ScrapedJob (Module 5 — Job Aggregation)
| Column | Type | Notes |
|---|---|---|
| id | cuid (PK) | |
| source | string | e.g. `remoteok`, `arbeitnow` — indexed |
| sourceUrl | string | **unique** — prevents duplicate records |
| externalId | string? | stable id from source |
| title, company, location, description | string(?) | company indexed |
| skills | string[] | |
| postedDate | datetime? | |
| scrapedAt | datetime | indexed |

## Design decisions
- **Indexing:** every foreign key and every column used for filtering/sorting (status, location, workMode, employmentType, createdAt, role) is indexed.
- **Referential integrity:** cascading deletes keep applications/saved jobs consistent when a job or user is removed.
- **Dedup:** `ScrapedJob.sourceUrl` unique + an existence check on insert (idempotent scraping).
- **Scraped jobs kept separate from `Job`** — they are read-only aggregated listings with no employer/owner, so mixing them into the employer-owned `Job` table would break ownership and application invariants.
