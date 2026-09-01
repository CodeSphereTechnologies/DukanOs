###############################################################################
# Webiface Revenue OS — Laravel/PHP-FPM Dockerfile (Coolify deployment)
#
# Multi-stage build:
#   Stage 1 (composer): Install production PHP dependencies
#   Stage 2 (production): PHP 8.3-FPM on Alpine with required extensions
#
# Extensions: pgsql/pdo_pgsql, redis (phpredis), zip, gd, intl, bcmath, pcntl,
#             opcache, exif — required by Laravel 13 + phpspreadsheet (imports).
#
# NOTE: PHP 8.4 is required. The installed Symfony 8.1 uses PHP 8.4 property
# hooks (e.g. Request.php), which PHP 8.3 cannot parse.
###############################################################################

# ─── Stage 1: Composer dependencies ─────────────────────────────────────────
FROM composer:2 AS composer

WORKDIR /app

# Copy only composer files first for layer caching
COPY backend/composer.json backend/composer.lock* ./

# Install production dependencies
RUN composer install \
        --no-interaction \
        --no-dev \
        --prefer-dist \
        --optimize-autoloader \
        --no-scripts \
        --ignore-platform-reqs

# ─── Stage 2: Production PHP-FPM ────────────────────────────────────────────
FROM php:8.4-fpm-alpine AS production

# Install system dependencies required by PHP extensions and runtime
RUN apk add --no-cache \
        nginx \
        postgresql-client \
        libpq \
        libzip \
        freetype \
        libpng \
        libjpeg-turbo \
        icu-libs \
        oniguruma \
        zip \
        unzip \
        wget \
        git \
        procps \
        $PHPIZE_DEPS

# Install PHP extensions via the official installer
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

RUN install-php-extensions \
        opcache \
        pcntl \
        bcmath \
        intl \
        exif \
        gd \
        zip \
        pdo_pgsql \
        pgsql \
        redis

# Copy custom php.ini
COPY coolify/docker/php/php.ini /usr/local/etc/php/conf.d/zz-webiface.ini

# Create application directory and set ownership
WORKDIR /var/www/backend

# Copy Composer vendor directory from Stage 1
COPY --from=composer /app/vendor /var/www/backend/vendor

# Copy application source (use .dockerignore-friendly copy; backend has no .git here)
COPY backend/ /var/www/backend/

# Ensure storage and bootstrap cache are writable
RUN mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/framework/testing storage/logs bootstrap/cache \
    && chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache \
    && chmod -R 775 /var/www/backend/storage /var/www/backend/bootstrap/cache

# Entrypoint handles migrations, key generation, storage link, cache
COPY coolify/docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm", "-F"]
