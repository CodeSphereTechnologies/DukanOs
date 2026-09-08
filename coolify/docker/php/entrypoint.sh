#!/bin/sh
###############################################################################
# Webiface Revenue OS — PHP-FPM entrypoint (Coolify deployment)
# DukanOS — Backend PHP-FPM Entrypoint (Coolify Deployment)
#
# Responsibilities:
#   1. Wait for PostgreSQL to accept connections
#   2. Generate APP_KEY if empty (unless explicitly disabled)
#   3. Run database migrations (configurable)
#   4. Optionally seed the database (configurable)
#   5. Create the storage symlink (php artisan storage:link)
#   6. Warm config/route/view caches (configurable)
#   7. Hand off to php-fpm
#
# All behaviour is driven by environment variables passed from docker-compose.
# Execution Lifecycle:
#   1. Wait for database (PostgreSQL) if using TCP host
#   2. Auto-generate APP_KEY if empty and enabled
#   3. Execute database migrations (php artisan migrate --force)
#   4. Optionally seed demo / initial store catalog data
#   5. Create storage symlink (php artisan storage:link)
#   6. Warm configuration and route caches
#   7. Pass execution to CMD (php-fpm, queue worker, or scheduler)
###############################################################################
set -e

echo "==> Webiface Revenue OS backend entrypoint starting"
echo "==> DukanOS backend entrypoint initialized"

# ── Wait for PostgreSQL ─────────────────────────────────────────────────────
wait_for_postgres() {
    echo "==> Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
# ── 1. Wait for Database (PostgreSQL) ────────────────────────────────────────
wait_for_database() {
    echo "==> Checking database connection at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
    until php -r '
        $host = getenv("DB_HOST") ?: "postgres";
        $port = getenv("DB_PORT") ?: "5432";
        $conn = @fsockopen($host, (int)$port, $errno, $errstr, 5);
        if ($conn) { fclose($conn); exit(0); }
        exit(1);
    '; do
        echo "   PostgreSQL not ready yet — retrying in 2s"
        echo "   Database not reachable yet — retrying in 2s..."
        sleep 2
    done
    echo "==> PostgreSQL is reachable"
    echo "==> Database is reachable"
}

# Only wait if using a TCP database host (skip for sqlite/local)
if [ "${DB_CONNECTION}" != "sqlite" ] && [ -n "${DB_HOST}" ]; then
    wait_for_postgres
    wait_for_database
fi

# ── Generate APP_KEY if missing ─────────────────────────────────────────────
cd /var/www/backend

# ── 2. Auto-generate APP_KEY ────────────────────────────────────────────────
if [ "${GENERATE_APP_KEY:-true}" = "true" ] && [ -z "${APP_KEY}" ]; then
    echo "==> APP_KEY not set — generating one"
    echo "==> APP_KEY not provided — generating new application key"
    php artisan key:generate --force
fi

cd /var/www/backend

# ── Migrations ──────────────────────────────────────────────────────────────
# ── 3. Database Migrations ──────────────────────────────────────────────────
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "==> Running database migrations"
    echo "==> Executing database migrations"
    php artisan migrate --force
fi

# ── Seed (default OFF — enable in Coolify UI for demo/dev data) ─────────────
# ── 4. Database Seeding ─────────────────────────────────────────────────────
if [ "${RUN_SEED:-false}" = "true" ]; then
    echo "==> Seeding database"
    echo "==> Seeding database (PunjabElectricStoreSeeder & catalog)"
    php artisan db:seed --force
fi

# ── Storage symlink ─────────────────────────────────────────────────────────
echo "==> Ensuring storage symlink"
# ── 5. Storage Symlink ──────────────────────────────────────────────────────
echo "==> Ensuring public storage link"
php artisan storage:link --force || true

# ── Cache warm-up ───────────────────────────────────────────────────────────
# ── 6. Cache Warm-Up ────────────────────────────────────────────────────────
if [ "${RUN_CACHE:-true}" = "true" ]; then
    echo "==> Warming caches"
    echo "==> Warming Laravel production caches"
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
    php artisan event:cache || true
fi

echo "==> Starting PHP-FPM"
echo "==> Handing off to process: $@"
exec "$@"
