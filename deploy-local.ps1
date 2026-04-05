#!/usr/bin/env pwsh
<#
.SYNOPSIS
    PATRY♡CLOSET — Full-Stack Local Deployment Script
.DESCRIPTION
    Launches the complete development environment in 3 separate PowerShell 7 windows:
      1. 🗄️  PostgreSQL 17 — Database monitor (psql live session)
      2. 🚀  ASP.NET Core API — Backend server (http://localhost:5200)
      3. 🌐  Vite + React — Frontend dev server (http://localhost:3000)

    Each console shows live logs and can be used interactively.
    The script validates prerequisites, runs health checks, and reports status.

.PARAMETER SkipDbCheck
    Skip PostgreSQL service verification (if using remote DB).
.PARAMETER NoBrowser
    Don't auto-open browser after deployment.
.PARAMETER BackendOnly
    Only start the backend (API + DB).
.PARAMETER FrontendOnly
    Only start the frontend.

.EXAMPLE
    .\deploy-local.ps1
    .\deploy-local.ps1 -NoBrowser
    .\deploy-local.ps1 -BackendOnly
#>

[CmdletBinding()]
param(
    [switch]$SkipDbCheck,
    [switch]$NoBrowser,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────
$ROOT_DIR       = $PSScriptRoot
$SERVER_DIR     = Join-Path $ROOT_DIR 'patry-closet-server'
$API_DIR        = Join-Path $SERVER_DIR 'src\PatryCloset.API'
$WEB_DIR        = Join-Path $ROOT_DIR 'patry-closet-web'
$API_URL        = 'http://localhost:5200'
$WEB_PORT       = 3000
$DB_HOST        = 'localhost'
$DB_PORT        = 5432
$DB_NAME        = 'patrycloset_dev'
$DB_USER        = 'postgres'
$PG_SERVICE     = 'postgresql-x64-17'
$PWSH_EXE       = 'pwsh'

# Colors
$C_RESET  = "`e[0m"
$C_GREEN  = "`e[32m"
$C_YELLOW = "`e[33m"
$C_RED    = "`e[31m"
$C_CYAN   = "`e[36m"
$C_BOLD   = "`e[1m"
$C_DIM    = "`e[2m"

# ─────────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────────
function Write-Banner {
    Write-Host ''
    Write-Host "${C_BOLD}${C_CYAN}╔══════════════════════════════════════════════════════════╗${C_RESET}"
    Write-Host "${C_BOLD}${C_CYAN}║            PATRY♡CLOSET — Local Deployment               ║${C_RESET}"
    Write-Host "${C_BOLD}${C_CYAN}╚══════════════════════════════════════════════════════════╝${C_RESET}"
    Write-Host "${C_DIM}  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  |  PowerShell $($PSVersionTable.PSVersion)${C_RESET}"
    Write-Host ''
}

function Write-Step([string]$Icon, [string]$Message) {
    Write-Host "  ${C_CYAN}${Icon}${C_RESET}  ${Message}"
}

function Write-Ok([string]$Message) {
    Write-Host "  ${C_GREEN}✔${C_RESET}  ${Message}"
}

function Write-Warn([string]$Message) {
    Write-Host "  ${C_YELLOW}⚠${C_RESET}  ${Message}"
}

function Write-Fail([string]$Message) {
    Write-Host "  ${C_RED}✖${C_RESET}  ${Message}"
}

function Test-CommandExists([string]$Cmd) {
    $null -ne (Get-Command $Cmd -ErrorAction SilentlyContinue)
}

function Test-PortInUse([int]$Port) {
    $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Stop-ProcessOnPort([int]$Port) {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($conn in $conns) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc -and $proc.ProcessName -ne 'System') {
                Write-Warn "Killing PID $($proc.Id) ($($proc.ProcessName)) on port $Port"
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Start-Sleep -Milliseconds 500
            }
        }
    }
}

function Wait-ForEndpoint([string]$Url, [int]$TimeoutSec = 30) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 3 -ErrorAction Stop
            if ($resp.StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Milliseconds 800
    }
    return $false
}

# ─────────────────────────────────────────────────────────────────
# Prerequisites Check
# ─────────────────────────────────────────────────────────────────
function Test-Prerequisites {
    Write-Host "${C_BOLD}  Prerequisites Check${C_RESET}"
    Write-Host "${C_DIM}  ────────────────────${C_RESET}"
    $ok = $true

    # PowerShell 7+
    if ($PSVersionTable.PSVersion.Major -ge 7) {
        Write-Ok "PowerShell $($PSVersionTable.PSVersion)"
    } else {
        Write-Fail "PowerShell 7+ required (found $($PSVersionTable.PSVersion))"
        $ok = $false
    }

    # .NET SDK
    if (Test-CommandExists 'dotnet') {
        $dotnetVersion = (dotnet --version 2>$null)
        Write-Ok ".NET SDK $dotnetVersion"
    } else {
        Write-Fail '.NET SDK not found'
        $ok = $false
    }

    # Node.js
    if (Test-CommandExists 'node') {
        $nodeVersion = (node --version 2>$null)
        Write-Ok "Node.js $nodeVersion"
    } else {
        Write-Fail 'Node.js not found'
        $ok = $false
    }

    # npm
    if (Test-CommandExists 'npm') {
        $npmVersion = (npm --version 2>$null)
        Write-Ok "npm $npmVersion"
    } else {
        Write-Fail 'npm not found'
        $ok = $false
    }

    # PostgreSQL
    if (-not $SkipDbCheck) {
        $pgSvc = Get-Service -Name $PG_SERVICE -ErrorAction SilentlyContinue
        if ($pgSvc -and $pgSvc.Status -eq 'Running') {
            Write-Ok "PostgreSQL ($PG_SERVICE) running"
        } elseif ($pgSvc) {
            Write-Warn "PostgreSQL service found but not running — starting..."
            Start-Service -Name $PG_SERVICE -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            $pgSvc = Get-Service -Name $PG_SERVICE
            if ($pgSvc.Status -eq 'Running') {
                Write-Ok "PostgreSQL started successfully"
            } else {
                Write-Fail "Could not start PostgreSQL"
                $ok = $false
            }
        } else {
            Write-Fail "PostgreSQL service '$PG_SERVICE' not found"
            $ok = $false
        }
    }

    # psql
    if (Test-CommandExists 'psql') {
        Write-Ok "psql CLI available"
    } else {
        # Try adding PostgreSQL bin to PATH
        $pgBin = 'C:\Program Files\PostgreSQL\17\bin'
        if (Test-Path $pgBin) {
            $env:PATH = "$pgBin;$env:PATH"
            Write-Warn "Added PostgreSQL bin to PATH"
        } else {
            Write-Warn "psql not found — database console may not work"
        }
    }

    # Project directories
    if (Test-Path $API_DIR) { Write-Ok "Backend project found" }
    else { Write-Fail "Backend not found at $API_DIR"; $ok = $false }

    if (Test-Path $WEB_DIR) { Write-Ok "Frontend project found" }
    else { Write-Fail "Frontend not found at $WEB_DIR"; $ok = $false }

    # node_modules
    if (-not (Test-Path (Join-Path $WEB_DIR 'node_modules'))) {
        Write-Warn 'node_modules missing — installing dependencies...'
        Push-Location $WEB_DIR
        npm install --legacy-peer-deps 2>&1 | Out-Null
        Pop-Location
        Write-Ok 'Dependencies installed'
    }

    Write-Host ''
    return $ok
}

# ─────────────────────────────────────────────────────────────────
# Free ports if occupied
# ─────────────────────────────────────────────────────────────────
function Clear-Ports {
    Write-Host "${C_BOLD}  Port Cleanup${C_RESET}"
    Write-Host "${C_DIM}  ────────────${C_RESET}"

    if (-not $FrontendOnly) {
        if (Test-PortInUse 5200) {
            Stop-ProcessOnPort 5200
            Write-Ok "Port 5200 freed"
        } else {
            Write-Ok "Port 5200 available"
        }
    }

    if (-not $BackendOnly) {
        if (Test-PortInUse $WEB_PORT) {
            Stop-ProcessOnPort $WEB_PORT
            Write-Ok "Port $WEB_PORT freed"
        } else {
            Write-Ok "Port $WEB_PORT available"
        }
    }

    Write-Host ''
}

# ─────────────────────────────────────────────────────────────────
# Launch Console Windows
# ─────────────────────────────────────────────────────────────────
function Start-DatabaseConsole {
    $dbScript = @"
`$Host.UI.RawUI.WindowTitle = '🗄️  PATRY CLOSET — PostgreSQL'
`$env:PGPASSWORD = 'postgres'
Write-Host ''
Write-Host '`e[1m`e[36m╔══════════════════════════════════════════════╗`e[0m'
Write-Host '`e[1m`e[36m║     🗄️  PostgreSQL 17 — Database Console     ║`e[0m'
Write-Host '`e[1m`e[36m╚══════════════════════════════════════════════╝`e[0m'
Write-Host ''
Write-Host '`e[2m  Database : $DB_NAME'
Write-Host '  Host     : ${DB_HOST}:${DB_PORT}'
Write-Host '  User     : $DB_USER'
Write-Host '  Schema   : patrycloset`e[0m'
Write-Host ''
Write-Host '`e[33m  Useful commands:`e[0m'
Write-Host '`e[2m    \dt patrycloset.*       — List all tables'
Write-Host '    \d+ patrycloset.\"Products\" — Describe Products table'
Write-Host '    SELECT count(*) FROM patrycloset.\"Products\";'
Write-Host '    SELECT count(*) FROM patrycloset.\"Orders\";'
Write-Host '    SELECT count(*) FROM patrycloset.\"Payments\";'
Write-Host '    \x                        — Toggle expanded display'
Write-Host '    \q                        — Quit`e[0m'
Write-Host ''
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
"@
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($dbScript))
    Start-Process $PWSH_EXE -ArgumentList "-NoExit", "-EncodedCommand", $encoded
    Write-Ok "Database console launched (psql → $DB_NAME)"
}

function Start-BackendConsole {
    $apiScript = @"
`$Host.UI.RawUI.WindowTitle = '🚀 PATRY CLOSET — API Server'
Write-Host ''
Write-Host '`e[1m`e[36m╔══════════════════════════════════════════════╗`e[0m'
Write-Host '`e[1m`e[36m║   🚀 ASP.NET Core API — Backend Server       ║`e[0m'
Write-Host '`e[1m`e[36m╚══════════════════════════════════════════════╝`e[0m'
Write-Host ''
Write-Host '`e[2m  URL      : $API_URL'
Write-Host '  Swagger  : $API_URL/swagger'
Write-Host '  Health   : $API_URL/api/v1/health'
Write-Host '  Env      : Development'
Write-Host '  DB       : ${DB_HOST}:${DB_PORT}/${DB_NAME}`e[0m'
Write-Host ''
Write-Host '`e[33m  Press Ctrl+C to stop the server.`e[0m'
Write-Host '`e[2m  ────────────────────────────────────────────`e[0m'
Write-Host ''
Set-Location '$API_DIR'
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
`$env:ASPNETCORE_URLS = '$API_URL'
dotnet run --no-launch-profile
"@
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($apiScript))
    Start-Process $PWSH_EXE -ArgumentList "-NoExit", "-EncodedCommand", $encoded
    Write-Ok "Backend console launched (dotnet run → $API_URL)"
}

function Start-FrontendConsole {
    $webScript = @"
`$Host.UI.RawUI.WindowTitle = '🌐 PATRY CLOSET — Frontend'
Write-Host ''
Write-Host '`e[1m`e[36m╔══════════════════════════════════════════════╗`e[0m'
Write-Host '`e[1m`e[36m║    🌐 Vite + React — Frontend Dev Server     ║`e[0m'
Write-Host '`e[1m`e[36m╚══════════════════════════════════════════════╝`e[0m'
Write-Host ''
Write-Host '`e[2m  Local    : http://localhost:${WEB_PORT}'
Write-Host '  API      : $API_URL'
Write-Host '  Mode     : Development (HMR enabled)`e[0m'
Write-Host ''
Write-Host '`e[33m  Press Ctrl+C to stop the dev server.`e[0m'
Write-Host '`e[2m  ────────────────────────────────────────────`e[0m'
Write-Host ''
Set-Location '$WEB_DIR'
npx vite --host
"@
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($webScript))
    Start-Process $PWSH_EXE -ArgumentList "-NoExit", "-EncodedCommand", $encoded
    Write-Ok "Frontend console launched (vite → http://localhost:${WEB_PORT})"
}

# ─────────────────────────────────────────────────────────────────
# Health Checks
# ─────────────────────────────────────────────────────────────────
function Invoke-HealthChecks {
    Write-Host "${C_BOLD}  Health Checks${C_RESET}"
    Write-Host "${C_DIM}  ─────────────${C_RESET}"

    if (-not $FrontendOnly) {
        Write-Step '⏳' "Waiting for API at ${API_URL}..."
        if (Wait-ForEndpoint "${API_URL}/api/v1/health" -TimeoutSec 40) {
            try {
                $health = Invoke-RestMethod -Uri "${API_URL}/api/v1/health" -TimeoutSec 5
                Write-Ok "API: $($health.status) (v$($health.version))"
            } catch {
                Write-Ok "API responding at ${API_URL}"
            }

            # Endpoint count
            try {
                $swagger = Invoke-RestMethod -Uri "${API_URL}/swagger/v1/swagger.json" -TimeoutSec 5
                $epCount = $swagger.paths.PSObject.Properties.Name.Count
                Write-Ok "Swagger: $epCount endpoints documented"
            } catch {
                Write-Warn "Swagger not reachable"
            }
        } else {
            Write-Warn "API did not respond in 40s — check backend console for errors"
        }
    }

    if (-not $BackendOnly) {
        Write-Step '⏳' "Waiting for Frontend..."
        if (Wait-ForEndpoint "http://localhost:${WEB_PORT}" -TimeoutSec 25) {
            Write-Ok "Frontend serving at http://localhost:${WEB_PORT}"
        } else {
            # Vite may pick next port
            if (Wait-ForEndpoint "http://localhost:3001" -TimeoutSec 5) {
                Write-Ok "Frontend serving at http://localhost:3001 (port 3000 was busy)"
            } else {
                Write-Warn "Frontend did not respond — check frontend console"
            }
        }
    }

    if (-not $SkipDbCheck -and -not $FrontendOnly) {
        try {
            $env:PGPASSWORD = 'postgres'
            $tables = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='patrycloset'" 2>$null
            $count = ($tables -replace '\s','')
            Write-Ok "Database: $count tables in schema 'patrycloset'"
        } catch {
            Write-Warn "Could not query database"
        }
    }

    Write-Host ''
}

# ─────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────
function Write-Summary {
    Write-Host "${C_BOLD}${C_GREEN}╔══════════════════════════════════════════════════════════╗${C_RESET}"
    Write-Host "${C_BOLD}${C_GREEN}║              ✅ Deployment Complete!                     ║${C_RESET}"
    Write-Host "${C_BOLD}${C_GREEN}╚══════════════════════════════════════════════════════════╝${C_RESET}"
    Write-Host ''
    if (-not $FrontendOnly) {
        Write-Host "  ${C_CYAN}🗄️  Database${C_RESET}   psql → ${DB_HOST}:${DB_PORT}/${DB_NAME}"
        Write-Host "  ${C_CYAN}🚀 Backend${C_RESET}    ${API_URL}  |  Swagger: ${API_URL}/swagger"
    }
    if (-not $BackendOnly) {
        Write-Host "  ${C_CYAN}🌐 Frontend${C_RESET}   http://localhost:${WEB_PORT}"
    }
    Write-Host ''
    Write-Host "${C_DIM}  Each console window shows live logs.${C_RESET}"
    Write-Host "${C_DIM}  Press Ctrl+C in any console to stop that service.${C_RESET}"
    Write-Host ''
}

# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────
function Main {
    Write-Banner

    # 1. Prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Fail "Prerequisites check failed. Fix errors above and retry."
        exit 1
    }

    # 2. Free ports
    Clear-Ports

    # 3. Launch consoles
    Write-Host "${C_BOLD}  Launching Services${C_RESET}"
    Write-Host "${C_DIM}  ──────────────────${C_RESET}"

    if (-not $FrontendOnly) {
        Start-DatabaseConsole
        Start-Sleep -Seconds 1
        Start-BackendConsole
        Start-Sleep -Seconds 1
    }

    if (-not $BackendOnly) {
        Start-FrontendConsole
        Start-Sleep -Seconds 1
    }

    Write-Host ''

    # 4. Health checks
    Invoke-HealthChecks

    # 5. Summary
    Write-Summary

    # 6. Open browser
    if (-not $NoBrowser) {
        if (-not $BackendOnly) {
            Start-Process "http://localhost:${WEB_PORT}"
        } elseif (-not $FrontendOnly) {
            Start-Process "${API_URL}/swagger"
        }
    }
}

Main
