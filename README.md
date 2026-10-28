# Infraon Flow

Infraon Flow is a multi-tenant SaaS platform for **OKR management and daily work execution**. It connects strategic objectives and measurable key results to initiatives and everyday tasks, so teams can see how daily work relates to outcomes.

```
Workspace → Objective → Key Result → Initiative → Task → Subtask
```

Key product rules (see `docs/`):

- Tasks may exist without an initiative (operational / personal work).
- Completing a task **never** changes key-result progress; KR progress comes only from measured values and check-ins.
- Personal and business workspaces; company, team and individual objectives.
- Strict workspace-level data isolation, enforced on the backend.

> **Status:** initial scaffold. Only the project foundation, the custom `User` model and the health-check API exist. Features are delivered milestone by milestone (M1–M6 in the PRD).

## Documentation

The source of truth for product and technical decisions is `docs/`:

| Document | File |
|---|---|
| Product Requirements | `docs/Infraon_Flow_Product_Requirements_Document_v1.0.md` |
| System Design & Architecture | `docs/Infraon_Flow_System_Design_Architecture_v1.0.md` |
| Database Design | `docs/Infraon_Flow_Database_Design_v1.0.md` |
| API Design | `docs/Infraon_Flow_API_Design_v1.0.md` |

## Architecture

```
Browser ── Angular 21 SPA (PrimeNG, Tailwind, Signals)
   │  HTTPS  (Authorization: Bearer <jwt>, X-Workspace-ID: <uuid>)
   ▼
Nginx (production) ── /           → Angular static build
                  └── /api/v1/*   → Gunicorn → Django REST Framework (modular monolith)
                                                   │
                                                   ▼
                                               PostgreSQL
```

- **Modular Django monolith** with one app per domain: `accounts`, `workspaces` (incl. teams), `okrs`, `initiatives`, `tasks` (incl. comments, daily plan), `activity` (activity log, notifications), `dashboard` (read-only aggregates). Cross-cutting API plumbing lives in `backend/common/`.
- **REST API** under `/api/v1/`, JSON with `snake_case` keys, UUID identifiers, page-number pagination (25 per page by default, 100 max).
- **Workspace context**: the `X-Workspace-ID` header selects the active workspace; the backend must verify active membership on every workspace-scoped request.
- **Errors** follow one envelope: `{"error": {"code", "message", "details", "request_id"}}`.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21.2 (standalone components, Signals, Router, Reactive Forms), TypeScript 5.9 (strict) |
| UI | PrimeNG 21.1 (Aura theme via `@primeuix/themes` 2.0), PrimeIcons 7, Tailwind CSS 4.3 |
| Frontend tooling | Angular CLI 21.2, ESLint 10 + angular-eslint 21, Vitest 4 |
| Backend | Python 3.13, Django 5.2 LTS, Django REST Framework 3.18 |
| Auth | JWT via djangorestframework-simplejwt 5.5 (rotating, blacklisted refresh tokens) |
| API docs | drf-spectacular 0.30 (OpenAPI 3) |
| Database | PostgreSQL (developed against 18) via psycopg 3 |
| Backend tooling | ruff, Django test runner |

## Prerequisites

- **Node.js** `^20.19`, `^22.12` or `>=24` (Angular 21 requirement) and **npm**.
  npm **10.9.2** has a dependency-resolution bug (`Cannot read properties of null (reading 'edgesOut')`). Use npm 11+, e.g. `npx npm@11 install`, or upgrade Node/npm.
- **Python 3.12+** (developed on 3.13).
- **PostgreSQL 14+** (developed on 18).
- Git.

## Project structure

```
infraon-flow/
├── backend/                     Django API
│   ├── config/                  settings (base / development / production), urls, wsgi, asgi
│   ├── common/                  error handler, request-id middleware, pagination, workspace header, health view
│   ├── apps/
│   │   ├── accounts/            custom User (email login, UUID pk)
│   │   ├── workspaces/          (M1) workspaces, memberships, invitations, teams
│   │   ├── okrs/                (M2) objectives, key results, check-ins
│   │   ├── initiatives/         (M3)
│   │   ├── tasks/               (M3/M4) tasks, subtasks, comments, daily plan
│   │   ├── activity/            (M5) activity log, notifications
│   │   └── dashboard/           (M5) read-only aggregates
│   ├── requirements/            base.txt, dev.txt, prod.txt
│   ├── manage.py
│   ├── pyproject.toml           ruff configuration
│   └── .env.example
├── frontend/                    Angular application
│   └── src/
│       ├── app/
│       │   ├── core/            auth, guards, interceptors, services, models
│       │   ├── shared/          reusable components, directives, pipes, utils
│       │   ├── layout/          main-layout, auth-layout, sidebar, topbar
│       │   ├── features/        auth, dashboard, okrs, initiatives, tasks, my-day, teams, reports, settings
│       │   ├── app.config.ts
│       │   └── app.routes.ts
│       └── environments/        environment.ts (prod), environment.development.ts
├── docs/                        product & technical documentation (source of truth)
├── .env.example
├── .gitignore
└── README.md
```

## PostgreSQL setup

Create a dedicated role and database. Open `psql` as the `postgres` superuser:

```powershell
# Windows PowerShell (psql is not on PATH by default)
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost
```

```bash
# Linux / macOS
psql -U postgres -h localhost
```

Then run (choose your own strong password):

```sql
CREATE ROLE infraon_flow WITH LOGIN PASSWORD 'choose-a-strong-password' CREATEDB;
CREATE DATABASE infraon_flow OWNER infraon_flow ENCODING 'UTF8';
```

`CREATEDB` lets the Django test runner create its temporary test database. Grant it only in local and CI environments.

## Environment configuration

**Backend:** copy the example and fill it in. `backend/.env` is git-ignored and must never be committed.

```powershell
# Windows PowerShell
Copy-Item backend\.env.example backend\.env
```

```bash
# Linux / macOS
cp backend/.env.example backend/.env
```

| Variable | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret key. Generate: `python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"` |
| `DJANGO_DEBUG` | `True` locally, `False` elsewhere |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames |
| `DJANGO_ADMIN_URL` | Admin path (default `admin/`) |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection |
| `JWT_SIGNING_KEY` | JWT signing key (defaults to the secret key; set separately in staging/prod) |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES`, `JWT_REFRESH_TOKEN_LIFETIME_DAYS`, `JWT_LEEWAY_SECONDS` | Token lifetimes and clock-skew tolerance |
| `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` | Trusted frontend origins (`http://localhost:4200` locally) |

**Frontend:** Angular has no runtime `.env`. Build-time settings live in `frontend/src/environments/`:

| File | Used by | `apiBaseUrl` |
|---|---|---|
| `environment.development.ts` | `ng serve` / development build | `http://localhost:8000/api/v1` |
| `environment.ts` | production build | `/api/v1` (same origin via Nginx) |

These values ship in the public bundle, so they must never contain secrets.

## Backend: install and run

```powershell
# Windows PowerShell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements\dev.txt
python manage.py migrate
python manage.py createsuperuser      # optional, for Django Admin
python manage.py runserver            # http://localhost:8000
```

```bash
# Linux / macOS
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py createsuperuser      # optional, for Django Admin
python manage.py runserver            # http://localhost:8000
```

`manage.py` defaults to `config.settings.development`; `wsgi.py`/`asgi.py` default to `config.settings.production`. Override with `DJANGO_SETTINGS_MODULE`.

## Frontend: install and run

```bash
cd frontend
npm install          # or: npx npm@11 install   (if you are on npm 10.9.x)
npm start            # ng serve → http://localhost:4200
```

The commands are the same in PowerShell and bash.

## Endpoints

| URL | Description |
|---|---|
| `GET http://localhost:8000/api/v1/health/` | Health check, returns `{"status": "ok", "application": "Infraon Flow API"}` |
| `http://localhost:8000/api/docs/` | Swagger UI |
| `http://localhost:8000/api/redoc/` | ReDoc |
| `http://localhost:8000/api/schema/` | OpenAPI schema (YAML; `?format=json` for JSON) |
| `http://localhost:8000/admin/` | Django Admin (staff only) |

Documentation paths follow the API Design document (§20). In production, the docs are restricted to staff users.

The topbar of the Angular app shows **API: online** when the frontend can reach the health endpoint.

## Development workflow

```bash
# Backend (from backend/, venv active)
python manage.py check
python manage.py test                 # requires PostgreSQL (role needs CREATEDB)
ruff check . && ruff format --check .
python manage.py makemigrations       # after model changes; review the generated SQL
python manage.py spectacular --validate --fail-on-warn --file schema.yaml

# Frontend (from frontend/)
npm run lint
npm test -- --watch=false
npm run build
```

Conventions:

- Follow `docs/` for models, API contracts and business rules. Raise inconsistencies before implementing.
- Every workspace-scoped query must be scoped by the resolved workspace after verifying active membership. Add cross-tenant tests for every resource.
- Domain rules go in backend services (`apps/<app>/services/`), not in views, serializers or Angular components.
- Use UUID primary keys, `settings.AUTH_USER_MODEL` for user FKs, and explicit `Meta.constraints` / `Meta.indexes`.
- Never commit `.env` files, credentials or tokens.
- Deliver vertical slices: API, UI, permissions and tests together.
