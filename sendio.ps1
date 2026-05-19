param(
    [Parameter(Position = 0)]
    [ValidateSet("up", "down", "art", "artisan", "comp", "composer", "test", "tinker", "migrate", "seed", "logs", "sh", "shell")]
    [string]$Command,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$ComposeDev = "docker-compose.dev.yml"
$ComposeProd = "docker-compose.yml"
$AppService = "app"
$User = "root"

function Show-Help {
    Write-Host "SendIO Management Utility" -ForegroundColor Cyan
    Write-Host "Usage: .\sendio.ps1 [command] [options]"
    Write-Host "Commands:"
    Write-Host "  up [prod]      Start the environment (default: dev)"
    Write-Host "  down [prod]    Stop the environment (default: dev)"
    Write-Host "  art [cmd]      Run Laravel Artisan command"
    Write-Host "  comp [cmd]     Run Composer command"
    Write-Host "  test           Run PHPUnit tests"
    Write-Host "  tinker         Enter Laravel Tinker"
    Write-Host "  migrate        Run migrations"
    Write-Host "  seed           Run seeders"
    Write-Host "  logs [prod]    Show logs"
    Write-Host "  sh [prod]      Enter the container shell"
}

if (-not $Command) {
    Show-Help
    return
}

$IsProd = $Arguments -contains "prod"
$ConfigFile = if ($IsProd) { $ComposeProd } else { $ComposeDev }
$ServiceName = $AppService

switch ($Command) {
    "up" {
        docker compose -f $ConfigFile up -d --build
    }
    "down" {
        docker compose -f $ConfigFile down
    }
    "art" {
        docker compose -f $ConfigFile exec -u $User $ServiceName php artisan $Arguments
    }
    "artisan" {
        docker compose -f $ConfigFile exec -u $User $ServiceName php artisan $Arguments
    }
    "comp" {
        docker compose -f $ConfigFile exec -u $User -e COMPOSER_ALLOW_SUPERUSER=1 $ServiceName composer $Arguments
    }
    "composer" {
        docker compose -f $ConfigFile exec -u $User -e COMPOSER_ALLOW_SUPERUSER=1 $ServiceName composer $Arguments
    }
    "test" {
        docker compose -f $ConfigFile exec -u $User $ServiceName php artisan test $Arguments
    }
    "tinker" {
        docker compose -f $ConfigFile exec -u $User $ServiceName php artisan tinker
    }
    "migrate" {
        docker compose -f $ConfigFile exec -u $User $ServiceName php artisan migrate $Arguments
    }
    "seed" {
        docker compose -f $ConfigFile exec -u $User $ServiceName php artisan db:seed $Arguments
    }
    "logs" {
        docker compose -f $ConfigFile logs -f $ServiceName
    }
    "sh" {
        docker compose -f $ConfigFile exec -u $User -it $ServiceName bash
    }
    "shell" {
        docker compose -f $ConfigFile exec -u $User -it $ServiceName bash
    }
}
