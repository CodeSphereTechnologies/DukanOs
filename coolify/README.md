###############################################################################
# DukanOS — Coolify Production Deployment Guide
###############################################################################

This directory contains the Dockerfiles, Nginx configurations, and PHP-FPM runtime settings configured for deploying **DukanOS** (Appliance & Electrical Store Operating System) via [Coolify](https://coolify.io).

---

## Service Architecture

```
[ Internet / Clients ]
          │
          ▼ (HTTPS / 443)
[ Coolify Traefik Proxy (SSL Termination) ]
          │
          ▼ (HTTP / Port 80 - Internal)
     ┌─────────┐
     │  nginx  │ ── serves React 19 SPA static assets (`dist/`)
     └────┬────┘
          │ (FastCGI: `/api/*`, `/sanctum/*`)
          ▼
   ┌──────────────┐      ┌─────────────┐
   │   backend    │ ───► │  postgres   │ (PostgreSQL 17 Database)
   │ (PHP 8.4-FPM)│      └─────────────┘
   └──────┬───────┘      ┌─────────────┐
          │ ───────────► │    redis    │ (Cache, Sessions & Queue Broker)
          ▼              └─────────────┘
   ┌──────────────┐             ▲
   │    queue     │ ────────────┘
   │ (Worker)     │
   └──────────────┘
   ┌──────────────┐
   │  scheduler   │
   │ (Cron Loop)  │
   └──────────────┘
```

1. **`nginx`** (Gateway): Single ingress service exposed to Coolify's Traefik proxy. Serves the pre-compiled React 19 SPA and forwards API/Auth requests to `backend:9000` via FastCGI.
2. **`backend`** (Laravel 13 API): PHP 8.4-FPM container with PostgreSQL, Redis, OPcache, and PHP extensions.
3. **`queue`** (Queue Worker): Runs background jobs (asynchronous invoice generation, email notifications, audit logs).
4. **`scheduler`** (Task Scheduler): Runs Laravel periodic scheduled tasks (`schedule:work`).
5. **`postgres`** (Database): PostgreSQL 17 Alpine with persistent storage volume (`dukanos_db_data`).
6. **`redis`** (Cache & Broker): Redis 7 Alpine with persistent storage volume (`dukanos_redis_data`).

---

## Directory Layout

```
docker-compose.yml              ← Main compose manifest at repository root
.dockerignore                   ← Excludes node_modules, logs, and artifacts
coolify/
├── .env.example                ← Environment template for Coolify UI
├── README.md                   ← This deployment guide
└── docker/
    ├── nginx/
    │   ├── Dockerfile          ← Multi-stage Node 22 + Nginx 1.27 gateway build
    │   ├── nginx.conf          ← Master Traefik-aware Nginx configuration
    │   └── default.conf        ← Server block routing for SPA, API, and storage
    └── php/
        ├── Dockerfile          ← PHP 8.4-FPM + Composer + PostgreSQL + Redis image
        ├── php.ini             ← Production PHP & OPcache configuration
        └── entrypoint.sh       ← Migration, keygen, storage:link, and cache warmer
```

---

## Step-by-Step Deployment in Coolify

### Step 1: Create a Docker Compose Application
1. In your Coolify dashboard, select your **Project** and **Environment**.
2. Click **+ New Resource** and select **Docker Compose**.
3. Connect your Git repository (GitHub / GitLab or custom Git URL).
4. Set the **Compose Path** to `docker-compose.yml` (default at repo root).

### Step 2: Configure Environment Variables
1. In Coolify, open the **Environment Variables** tab for the application.
2. Copy all variables from [`coolify/.env.example`](./.env.example) and paste them into the input box.
3. Update the following values:
   - `APP_URL`: Set to your live production domain (e.g. `https://app.yourdomain.com`).
   - `FRONTEND_URL`: Same as `APP_URL`.
   - `SANCTUM_STATEFUL_DOMAINS`: Bare hostname without scheme (e.g. `app.yourdomain.com`).
   - `DB_PASSWORD`: Set a secure database password.
   - `REDIS_PASSWORD`: Set a secure Redis password.
   - `RUN_SEED`: Set to `true` on first deploy if you want initial seeded demo accounts and electrical inventory catalog. Set to `false` for clean production.

### Step 3: Configure Domain & Traefik
1. Navigate to the **Domains** tab or service settings in Coolify.
2. Set the public domain on the **`nginx`** service (e.g. `https://app.yourdomain.com`).
3. Ensure the internal port is set to `80`.
4. Coolify's Traefik will automatically provision and renew a Let's Encrypt SSL/TLS certificate.

### Step 4: Deploy
1. Click **Deploy**.
2. Coolify will build the multi-stage images, initialize PostgreSQL & Redis, execute migrations, warm caches, and start the gateway.
3. Access your domain in the browser.

---

## Local Docker Compose Validation

To validate the configuration syntax and variable interpolation on your local system:

```bash
docker compose -f docker-compose.yml config
```
