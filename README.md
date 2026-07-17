# 📅 Post Scheduler

A full-stack **social media post scheduling** platform built as a monorepo. Users can connect their social media accounts and schedule posts to be published automatically.

---

## 🏗️ Architecture

This project is a **Turborepo monorepo** powered by `pnpm` workspaces, containing a Next.js frontend, a FastAPI backend, and a shared auto-generated API client.

```
post-scheduler/
├── apps/
│   ├── web/          # Next.js 16 frontend (React 19, Tailwind CSS v4, shadcn/ui)
│   └── backend/      # FastAPI backend (Python 3.13, SQLAlchemy, Alembic)
└── packages/
    ├── api-client/         # Auto-generated TypeScript API client (@hey-api/openapi-ts)
    ├── eslint-config/      # Shared ESLint configuration
    └── typescript-config/  # Shared TypeScript configuration
```

---

## ✨ Features

- 🔐 **User Authentication** — Signup & login with hashed passwords (`bcrypt`)
- 🌐 **Social Media Integration** — LinkedIn OAuth integration (Facebook, LinkedIn supported)
- 🗓️ **Post Scheduling** — Schedule posts with recurrence support (minutes, hours, days)
- 🧠 **Autonomous Posting Agent** — AI-powered post writer using **LangChain** and **Google Gemini** (`gemini-2.0-flash`)
- 💾 **Long-Term Memory** — Persistent context tracking using **Supermemory** (via isolated per-scheduler tags) to prevent content duplication across runs
- 🔄 **Auto-Generated API Client** — TypeScript client generated from the FastAPI OpenAPI schema
- 🛡️ **Async Backend** — Fully async FastAPI + SQLAlchemy with PostgreSQL via `asyncpg`

---

## 🛠️ Tech Stack

| Layer        | Technology                                         |
|--------------|----------------------------------------------------|
| Frontend     | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui  |
| Backend      | FastAPI, SQLAlchemy 2, Alembic, Uvicorn            |
| AI Engine    | LangChain, langchain-google-genai, supermemory     |
| Database     | PostgreSQL (async via `asyncpg`)                   |
| API Client   | `@hey-api/openapi-ts` (auto-generated from OpenAPI)|
| Monorepo     | Turborepo, pnpm workspaces                         |
| Language     | TypeScript 5.9 (frontend), Python 3.13 (backend)  |

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) 9.x — `npm install -g pnpm@9`
- [Python](https://python.org/) >= 3.13
- [uv](https://docs.astral.sh/uv/) — fast Python package manager
- [PostgreSQL](https://www.postgresql.org/) running locally

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone git@github.com:codernex/post-scheduler.git
cd post-scheduler
```

### 2. Install JavaScript dependencies

```bash
pnpm install
```

### 3. Set up the Python backend

```bash
cd apps/backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r pyproject.toml
```

### 4. Configure environment variables

Create a `.env` file in `apps/backend/`:

```env
DATABASE_URL="postgresql+asyncpg://<user>:<password>@127.0.0.1:5432/scheduler"
LINKEDIN_CLIENT_ID="your_linkedin_client_id"
LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret"
LINKEDIN_REDIRECT_URI="http://localhost:8081/api/v1/social-media/connect/linkedin/callback"
JWT_SECRET="your_secure_jwt_secret_key"

# AI Agent Configuration
GEMINI_API_KEY="your_gemini_api_key_here"
SUPERMEMORY_API_KEY="your_supermemory_api_key_here"
```

### 5. Run database migrations

```bash
# From apps/backend/ with the venv activated
alembic upgrade head
```

### 6. Seed the database

Populates the `social_media` table with initial platforms (Facebook, LinkedIn):

```bash
# From apps/backend/ with the venv activated
make seed
```

---

## 🐳 Running with Docker

You can run the entire stack (Next.js frontend, FastAPI backend, and a PostgreSQL database) inside Docker using Docker Compose.

### 1. Configure root environment variables

Create a `.env` file in the project root directory (next to `docker-compose.yml`):

```env
# Database Settings (handled automatically by Docker Compose postgres service)
DATABASE_URL="postgresql+asyncpg://postgres:123456@postgres:5432/scheduler"

# Authentication & JWT
JWT_SECRET="your_secure_jwt_secret_key"

# Social Media Integration (LinkedIn / Facebook OAuth)
LINKEDIN_CLIENT_ID="your_linkedin_client_id"
LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret"
LINKEDIN_REDIRECT_URI="http://localhost:8081/api/v1/social-media/connect/linkedin/callback"

FACEBOOK_CLIENT_ID="your_facebook_client_id"
FACEBOOK_CLIENT_SECRET="your_facebook_client_secret"
FACEBOOK_REDIRECT_URI="http://localhost:8081/api/v1/social-media/connect/facebook/callback"

# AI Agent Configuration
OPENROUTER_API_KEY="your-openrouter-key"
OPENROUTER_MODEL="openai/gpt-4o"
SUPERMEMORY_API_KEY="your_supermemory_api_key_here"
```

### 2. Build and start services

Run the following command from the project root:

```bash
docker compose up --build -d
```

This will build the images and run three containers:
*   **PostgreSQL**: Exposed locally on port `5435`
*   **FastAPI Backend**: Exposed locally on port `8081` (migrations run automatically on start)
*   **Next.js Frontend**: Exposed locally on port `3000`

### 3. Seed the database (initial run only)

To populate the database with the initial social media platform definitions inside the running container, run:

```bash
docker compose exec backend sh -c "PYTHONPATH=src python -m core.seed"
```

---


## 💻 Development

Run all services concurrently from the repo root:

```bash
pnpm dev
```

This starts:
- **Frontend** at `http://localhost:3000` (Next.js dev server)
- **Backend** at `http://localhost:8081` (Uvicorn with `--reload`)
- **API client generator** watching for OpenAPI schema changes

To run services individually:

```bash
# Frontend only
pnpm dev:frontend

# Backend only
pnpm dev:backend

# Regenerate the TypeScript API client (backend must be running)
pnpm generate
```

---

## 🔌 API Overview

The backend is served at `http://localhost:8081` and exposes interactive docs at:

- **Swagger UI**: `http://localhost:8081/docs`
- **ReDoc**: `http://localhost:8081/redoc`
- **OpenAPI JSON**: `http://localhost:8081/openapi.json`

### Auth Endpoints (`/api/v1/auth`)

| Method | Endpoint   | Description          |
|--------|------------|----------------------|
| POST   | `/signup`  | Register a new user  |
| POST   | `/login`   | Authenticate a user  |

### Social Media Endpoints (`/api/v1/social-media`)

| Method | Endpoint                    | Description                                                   |
|--------|-----------------------------|---------------------------------------------------------------|
| GET    | `/connect/linkedin`         | Initiate LinkedIn integration connection (redirects to OAuth)  |
| GET    | `/connect/linkedin/callback`| LinkedIn OAuth callback (handles integration token persistence)|
| GET    | `/status`                   | Get connected/disconnected integration status of platforms    |
| DELETE | `/disconnect/{platform}`    | Disconnect a connected social media platform                  |

### Scheduler Endpoints (`/api/v1/scheduler`)

| Method | Endpoint              | Description                                             |
|--------|-----------------------|---------------------------------------------------------|
| POST   | `/`                   | Create a new post scheduler config                      |
| GET    | `/`                   | Get all post schedules for the authenticated user       |
| DELETE | `/{schedule_id}`      | Delete a specific scheduler configuration               |
| GET    | `/{schedule_id}/logs` | Get execution audit logs for a specific scheduler       |

---

## 📦 Packages

### `@repo/api-client`

A TypeScript API client auto-generated from the FastAPI OpenAPI schema using [`@hey-api/openapi-ts`](https://heyapi.dev/). It is consumed directly by the `web` app via a pnpm workspace alias.

To regenerate after backend changes (backend must be running):

```bash
pnpm generate
```

### `@repo/eslint-config` & `@repo/typescript-config`

Shared linting and TypeScript configurations used across all apps and packages in the monorepo.

---

## 🗄️ Database Schema

| Table             | Description                                                            |
|-------------------|------------------------------------------------------------------------|
| `users`           | Registered users with hashed passwords                                |
| `social_media`    | Supported social platforms (Facebook, LinkedIn, …)                    |
| `user_social_media` | Many-to-many: users ↔ connected accounts                           |
| `scheduler`       | Scheduled post settings (recurrence, runs, user prompts)               |
| `task_executions` | Active execution queue entries pulled by workers                       |
| `scheduler_logs`  | Audit log history tracking published contents & generation outcomes   |
| `api_tokens`      | OAuth tokens for social media integrations                            |

Migrations are managed with [Alembic](https://alembic.sqlalchemy.org/):

```bash
# Generate a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

---

## 🔧 Available Scripts

### Root (from `post-scheduler/`)

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `pnpm dev`           | Start all services concurrently                  |
| `pnpm dev:frontend`  | Start the Next.js dev server only                |
| `pnpm dev:backend`   | Start the FastAPI Uvicorn server only            |
| `pnpm generate`      | Regenerate the TypeScript API client             |
| `pnpm build`         | Build all apps via Turborepo                     |
| `pnpm lint`          | Lint all packages                                |
| `pnpm check-types`   | Type-check all packages                          |
| `pnpm format`        | Format all `.ts`, `.tsx`, and `.md` files        |

### Backend (from `apps/backend/`)

| Command      | Description                                |
|--------------|--------------------------------------------|
| `make run`   | Start the Uvicorn dev server on port 8081  |
| `make seed`  | Seed the database with initial data        |
