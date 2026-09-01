###############################################################################
# Webiface Revenue OS — Coolify Deployment Guide
###############################################################################

This directory contains the Dockerfiles, nginx configs, and PHP runtime config
used to deploy the Webiface Revenue OS (the cold-calling CRM defined in
`AGENTS.md`) via [Coolify](https://coolify.io).

The stack matches the project's actual services:

- **nginx** — gateway: serves the React SPA and reverse-proxies `/api`,
  `/sanctum`, and `/storage` to the backend via FastCGI. This is the only
  service exposed through Coolify's Traefik proxy.
- **backend** — Laravel 13 API on PHP 8.3-FPM.
- **queue** — Laravel queue worker (`queue:work redis`).
- **scheduler** — Laravel task scheduler loop.
- **postgres** — PostgreSQL 18 (primary relational database).
- **redis** — Redis 7 (cache, sessions, queue broker).
- **minio** — MinIO (S3-compatible object storage for recordings/screenshots).

There is **no** Twilio/VoIP dialer and **no** WebSocket/realtime service yet
(calls are placed manually via Google Voice, per `AGENTS.md`). The compose file
is structured so those can be added later without disturbing the gateway.

## Repository layout

```
docker-compose.yml            ← compose manifest at repo root (build context = repo root)
coolify/
├── .env.example             ← env vars to paste into Coolify UI
├── README.md                ← this file
└── docker/
    ├── nginx/
    │   ├── Dockerfile        ← builds the React SPA + nginx gateway
    │   ├── nginx.conf        ← master nginx config (Traefik-aware)
    │   └── default.conf      ← server block (API + SPA routing)
    └── php/
        ├── Dockerfile        ← Laravel/PHP-FPM image
        ├── php.ini           ← PHP runtime overrides
        └── entrypoint.sh     ← migrate / keygen / cache / storage:link
```

## Deploy in Coolify

1. In Coolify, create a new **Docker Compose** resource.
2. Connect your Git repository (the repo root).
3. Set the compose path to `docker-compose.yml`.
4. Open **Environment Variables** and paste the contents of
   `coolify/.env.example`, then change every `change_me_*` value.
5. Go to the **Domains** tab and assign your domain (e.g. `crm.webiface.com`)
   to the **nginx** service. Coolify's Traefik will issue a Let's Encrypt cert
   and route traffic to nginx:80.
6. Deploy.

Coolify differences handled by this stack (do **not** add `ports:` or
`container_name:`):

- No exposed ports — Traefik is the only ingress.
- No `container_name` — Coolify names containers with UUID suffixes.
- Only `nginx` has `traefik.enable=true`; every other service is internal.
- Inline `configs:` (no `file:` references) to avoid Coolify path issues.
- Volumes use the `local` driver (Coolify manages lifecycle).

## How the gateway works

- The React app is built at image build time with `VITE_API_URL=''`, so all
  API calls are **same-origin**. nginx proxies `/api` → `backend:9000` via
  FastCGI, and `/sanctum` for the CSRF cookie. No CORS configuration needed.
- `$proxy_x_forwarded_proto` is used (not `$scheme`) so the backend sees the
  real HTTPS scheme through Traefik. `TRUSTED_PROXIES=*` makes Laravel trust
  the forwarded headers.
- `SANCTUM_STATEFUL_DOMAINS` must contain the bare hostname you assign to
  nginx (Coolify UI) so the SPA session auth works.

## First run

- The backend entrypoint waits for PostgreSQL, auto-generates `APP_KEY` if
  unset, runs `migrate --force`, creates the `storage:link`, and warms caches.
- Set `RUN_SEED=true` (in Coolify env) only if you want demo/dev data.
- Uploaded files live in the shared `app_storage` volume, served by nginx at
  `/storage`. MinIO is available for S3-disk attachments (set `FILESYSTEM_DISK=s3`).

## Local validation

If Docker is available locally you can sanity-check the compose file from the
repo root:

```bash
docker compose -f docker-compose.yml config
```

(This validates syntax and variable interpolation; it does not build images.)
