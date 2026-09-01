#!/bin/sh
###############################################################################
# Webiface Revenue OS — PHP-FPM entrypoint (Coolify deployment)
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
###############################################################################
set -e

echo "==> Webiface Revenue OS backend entrypoint starting"

# ── Wait for PostgreSQL ─────────────────────────────────────────────────────
wait_for_postgres() {
    echo "==> Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
    until php -r '
        $host = getenv("DB_HOST") ?: "postgres";
        $port = getenv("DB_PORT") ?: "5432";
        $conn = @fsockopen($host, (int)$port, $errno, $errstr, 5);
        if ($conn) { fclose($conn); exit(0); }
        exit(1);
    '; do
        echo "   PostgreSQL not ready yet — retrying in 2s"
        sleep 2
    done
    echo "==> PostgreSQL is reachable"
}

# Only wait if using a TCP database host (skip for sqlite/local)
if [ "${DB_CONNECTION}" != "sqlite" ] && [ -n "${DB_HOST}" ]; then
    wait_for_postgres
fi

# ── Generate APP_KEY if missing ─────────────────────────────────────────────
if [ "${GENERATE_APP_KEY:-true}" = "true" ] && [ -z "${APP_KEY}" ]; then
    echo "==> APP_KEY not set — generating one"
    php artisan key:generate --force
fi

cd /var/www/backend

# ── Migrations ──────────────────────────────────────────────────────────────
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "==> Running database migrations"
    php artisan migrate --force
fi

# ── Seed (default OFF — enable in Coolify UI for demo/dev data) ─────────────
if [ "${RUN_SEED:-false}" = "true" ]; then
    echo "==> Seeding database"
    php artisan db:seed --force
fi

# ── Storage symlink ─────────────────────────────────────────────────────────
echo "==> Ensuring storage symlink"
php artisan storage:link --force || true

# ── Cache warm-up ───────────────────────────────────────────────────────────
if [ "${RUN_CACHE:-true}" = "true" ]; then
    echo "==> Warming caches"
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
    php artisan event:cache || true
fi

echo "==> Starting PHP-FPM"
exec "$@"
