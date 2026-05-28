#!/bin/bash

COMPOSE_DEV="docker-compose.dev.yml"
COMPOSE_PROD="docker-compose.yml"
APP_SERVICE="app"

COMMAND=$1
shift
ARGUMENTS=$@

IS_PROD=false
if [[ " $ARGUMENTS " =~ " prod " ]]; then
    IS_PROD=true
fi

CONFIG_FILE=$COMPOSE_DEV
SERVICE_NAME=$APP_SERVICE
USER="root"

if [ "$IS_PROD" = true ]; then
    CONFIG_FILE=$COMPOSE_PROD
fi

function show_help() {
    echo "SendIO Management Utility"
    echo "Usage: ./sendio.sh [command] [options]"
    echo "Commands:"
    echo "  up [prod]      Start the environment (default: dev)"
    echo "  down [prod]    Stop the environment (default: dev)"
    echo "  art [cmd]      Run Laravel Artisan command"
    echo "  comp [cmd]     Run Composer command"
    echo "  test           Run PHPUnit tests"
    echo "  tinker         Enter Laravel Tinker"
    echo "  migrate        Run migrations"
    echo "  seed           Run seeders"
    echo "  logs [prod]    Show logs"
    echo "  queue [prod]   Show queue worker logs"
    echo "  queue-restart  Restart Laravel queue workers"
    echo "  sh [prod]      Enter the container shell"
}

case "$COMMAND" in
    up)
        docker compose -f "$CONFIG_FILE" up -d --build
        ;;
    down)
        docker compose -f "$CONFIG_FILE" down
        ;;
    art|artisan)
        docker compose -f "$CONFIG_FILE" exec -u "$USER" "$SERVICE_NAME" php artisan $ARGUMENTS
        ;;
    comp|composer)
        docker compose -f "$CONFIG_FILE" exec -u "$USER" -e COMPOSER_ALLOW_SUPERUSER=1 "$SERVICE_NAME" composer $ARGUMENTS
        ;;
    test)
        docker compose -f "$CONFIG_FILE" exec -u "$USER" "$SERVICE_NAME" php artisan test $ARGUMENTS
        ;;
    tinker)
        docker compose -f "$CONFIG_FILE" exec -u "$USER" "$SERVICE_NAME" php artisan tinker
        ;;
    migrate)
        docker compose -f "$CONFIG_FILE" exec -u "$USER" "$SERVICE_NAME" php artisan migrate $ARGUMENTS
        ;;
    seed)
        docker compose -f "$CONFIG_FILE" exec -u "$USER" "$SERVICE_NAME" php artisan db:seed $ARGUMENTS
        ;;
    logs)
        docker compose -f "$CONFIG_FILE" logs -f "$SERVICE_NAME"
        ;;
    queue)
        docker compose -f "$CONFIG_FILE" logs -f queue-worker
        ;;
    queue-restart)
        docker compose -f "$CONFIG_FILE" exec -u "$USER" "$SERVICE_NAME" php artisan queue:restart
        ;;
    sh|shell)
        docker compose -f "$CONFIG_FILE" exec -u "$USER" -it "$SERVICE_NAME" bash
        ;;
    *)
        show_help
        ;;
esac
