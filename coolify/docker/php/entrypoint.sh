#!/bin/sh
###############################################################################
# DukanOS — Backend PHP-FPM Entrypoint (Coolify Deployment)
#
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

echo "==> DukanOS backend entrypoint initialized"

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
        echo "   Database not reachable yet — retrying in 2s..."
        sleep 2
    done
    echo "==> Database is reachable"
}

if [ "${DB_CONNECTION}" != "sqlite" ] && [ -n "${DB_HOST}" ]; then
    wait_for_database
fi

cd /var/www/backend

# ── 2. Auto-generate APP_KEY ────────────────────────────────────────────────
if [ "${GENERATE_APP_KEY:-true}" = "true" ] && [ -z "${APP_KEY}" ]; then
    echo "==> APP_KEY not provided — generating new application key"
    php artisan key:generate --force
fi

# ── 3. Database Migrations ──────────────────────────────────────────────────
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "==> Executing database migrations"
    php artisan migrate --force
fi

# ── 4. Database Seeding ─────────────────────────────────────────────────────
if [ "${RUN_SEED:-false}" = "true" ]; then
    echo "==> Seeding database (PunjabElectricStoreSeeder & catalog)"
    php artisan db:seed --force
fi

# ── 5. Storage Symlink ──────────────────────────────────────────────────────
echo "==> Ensuring public storage link"
php artisan storage:link --force || true

# ── 6. Cache Warm-Up ────────────────────────────────────────────────────────
if [ "${RUN_CACHE:-true}" = "true" ]; then
    echo "==> Warming Laravel production caches"
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
    php artisan event:cache || true
fi

echo "==> Handing off to process: $@"
exec "$@"
