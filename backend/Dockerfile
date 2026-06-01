FROM php:8.4-fpm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        curl \
        nginx \
        unzip \
        libpq-dev \
        libzip-dev \
        libzstd-dev \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && pecl install redis mongodb \
    && docker-php-ext-enable redis mongodb \
    && rm -rf /var/lib/apt/lists/* /etc/nginx/sites-enabled/default

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN COMPOSER_ALLOW_SUPERUSER=1 composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --no-autoloader \
    --prefer-dist

COPY . .
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

RUN COMPOSER_ALLOW_SUPERUSER=1 composer dump-autoload \
    --optimize \
    --no-dev \
    --no-interaction \
    && mkdir -p \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80

CMD ["sh", "-c", "php-fpm -D && nginx -g 'daemon off;'"]
