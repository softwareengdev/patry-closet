#!/usr/bin/env pwsh
#Requires -Version 7.0

<#
.SYNOPSIS
    PATRY♡CLOSET — Interactive Local Deployment Console
.DESCRIPTION
    Advanced deployment and management script for the Patry Closet e-commerce platform.
    Manages PostgreSQL, Redis, Backend API, and Frontend services with interactive menu.
    Features admin authentication, advanced logging, service management, and health monitoring.
.PARAMETER SkipAuth
    Bypass the authentication prompt (for scripted/CI usage).
.PARAMETER LogDir
    Directory for log files. Defaults to .\logs under the script root.
.NOTES
    Credentials: Admin / Admin
.EXAMPLE
    .\deploy-local.ps1
    .\deploy-local.ps1 -SkipAuth
#>

param(
    [switch]$SkipAuth,
    [string]$LogDir = "$PSScriptRoot\logs"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# ═══════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════
$script:Config = @{
    ProjectRoot    = $PSScriptRoot
    ServerDir      = Join-Path $PSScriptRoot "patry-closet-server"
    WebDir         = Join-Path $PSScriptRoot "patry-closet-web"
    ApiUrl         = "http://localhost:5200"
    FrontendUrl    = "http://localhost:5173"
    PgHost         = "localhost"
    PgPort         = 5432
    PgUser         = "postgres"
    PgPassword     = "postgres"
    PgDatabase     = "patrycloset_dev"
    PgService      = "postgresql-x64-17"
    RedisHost      = "localhost"
    RedisPort      = 6379
    LogDir         = $LogDir
    AdminUser      = "Admin"
    AdminPass      = "Admin"
}

# Process tracking
$script:Processes = @{
    PostgreSQL = $null
    Redis      = $null
    Backend    = $null
    Frontend   = $null
}

$script:LogFile = $null

# ═══════════════════════════════════════════════════════════════
# UI Helpers
# ═══════════════════════════════════════════════════════════════
function Write-Banner {
    Clear-Host
    $banner = @"

  `e[1m`e[35m╔═══════════════════════════════════════════════════════════╗`e[0m
  `e[1m`e[35m║                                                           ║`e[0m
  `e[1m`e[35m║            P A T R Y ♡ C L O S E T                        ║`e[0m
  `e[1m`e[35m║                                                           ║`e[0m
  `e[1m`e[35m║          Infrastructure Management Console                ║`e[0m
  `e[1m`e[35m║                                                           ║`e[0m
  `e[1m`e[35m╚═══════════════════════════════════════════════════════════╝`e[0m

"@
    Write-Host $banner
    Write-Host "  `e[2m$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  |  PowerShell $($PSVersionTable.PSVersion)`e[0m"
    Write-Host ""
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $entry = "[$ts] [$Level] $Message"

    switch ($Level) {
        "ERROR"   { Write-Host "  `e[31m❌ $Message`e[0m" }
        "WARN"    { Write-Host "  `e[33m⚠  $Message`e[0m" }
        "SUCCESS" { Write-Host "  `e[32m✅ $Message`e[0m" }
        "STEP"    { Write-Host "  `e[36m🔧 $Message`e[0m" }
        default   { Write-Host "  `e[2mℹ  $Message`e[0m" }
    }

    if ($script:LogFile) {
        $entry | Out-File -FilePath $script:LogFile -Append -Encoding utf8
    }
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "  `e[2m─────────────────────────────────────────────────`e[0m"
    Write-Host "  `e[1m$Title`e[0m"
    Write-Host "  `e[2m─────────────────────────────────────────────────`e[0m"
}

function Write-StatusLine {
    param([string]$Service, [string]$Status, [string]$Details = "")
    $color = switch ($Status) {
        "Running"  { "32" }
        "Stopped"  { "31" }
        "Starting" { "33" }
        "Error"    { "31" }
        default    { "2" }
    }
    $icon = switch ($Status) {
        "Running"  { "●" }
        "Stopped"  { "○" }
        "Starting" { "◌" }
        "Error"    { "✗" }
        default    { "?" }
    }
    $line = "  `e[${color}m$icon $($Service.PadRight(15)) [$Status]`e[0m"
    if ($Details) { $line += "  `e[2m$Details`e[0m" }
    Write-Host $line
}

# ═══════════════════════════════════════════════════════════════
# Authentication
# ═══════════════════════════════════════════════════════════════
function Invoke-Authentication {
    Write-Banner
    Write-Host "  `e[33m🔐 Authentication Required`e[0m"
    Write-Host ""

    for ($attempt = 1; $attempt -le 3; $attempt++) {
        $user = Read-Host "  Username"
        $pass = Read-Host "  Password" -MaskInput

        if ($user -eq $script:Config.AdminUser -and $pass -eq $script:Config.AdminPass) {
            Write-Host ""
            Write-Log "Authentication successful — Welcome, $user" "SUCCESS"
            Start-Sleep -Seconds 1
            return $true
        }

        $remaining = 3 - $attempt
        if ($remaining -gt 0) {
            Write-Log "Invalid credentials. $remaining attempt(s) remaining." "ERROR"
        }
    }

    Write-Log "Authentication failed — access denied." "ERROR"
    Start-Sleep -Seconds 2
    return $false
}

# ═══════════════════════════════════════════════════════════════
# Port & Process Utilities
# ═══════════════════════════════════════════════════════════════
function Test-PortInUse([int]$Port) {
    $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

# ═══════════════════════════════════════════════════════════════
# Service Management
# ═══════════════════════════════════════════════════════════════
function Start-PostgreSQL {
    Write-Log "Starting PostgreSQL..." "STEP"
    try {
        # Try native Windows service first
        $pgSvc = Get-Service -Name $script:Config.PgService -ErrorAction SilentlyContinue
        if ($pgSvc) {
            if ($pgSvc.Status -eq 'Running') {
                $script:Processes.PostgreSQL = "service:$($script:Config.PgService)"
                Write-Log "PostgreSQL already running (Windows service)" "SUCCESS"
                return
            }
            Start-Service -Name $script:Config.PgService -ErrorAction Stop
            $script:Processes.PostgreSQL = "service:$($script:Config.PgService)"
            Write-Log "PostgreSQL started via Windows service on port $($script:Config.PgPort)" "SUCCESS"
            return
        }

        # Fallback to Docker
        $dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
        if ($dockerAvailable) {
            $existing = docker ps -a --filter "name=patrycloset-postgres" --format "{{.Names}}" 2>$null
            if ($existing) {
                docker start patrycloset-postgres 2>$null | Out-Null
            } else {
                docker run -d --name patrycloset-postgres `
                    -e POSTGRES_DB=$($script:Config.PgDatabase) `
                    -e POSTGRES_USER=$($script:Config.PgUser) `
                    -e POSTGRES_PASSWORD=$($script:Config.PgPassword) `
                    -p "$($script:Config.PgPort):5432" `
                    postgres:17-alpine 2>$null | Out-Null
            }
            $script:Processes.PostgreSQL = "docker:patrycloset-postgres"
            Write-Log "PostgreSQL started via Docker on port $($script:Config.PgPort)" "SUCCESS"
            return
        }

        Write-Log "No PostgreSQL service or Docker found — cannot start PostgreSQL" "ERROR"
    }
    catch {
        Write-Log "Failed to start PostgreSQL: $_" "ERROR"
    }
}

function Start-Redis {
    Write-Log "Starting Redis..." "STEP"
    try {
        $dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
        if (-not $dockerAvailable) {
            Write-Log "Docker not available — cannot start Redis" "WARN"
            return
        }

        $existing = docker ps -a --filter "name=patrycloset-redis" --format "{{.Names}}" 2>$null
        if ($existing) {
            docker start patrycloset-redis 2>$null | Out-Null
        } else {
            docker run -d --name patrycloset-redis `
                -p "$($script:Config.RedisPort):6379" `
                redis:7-alpine redis-server --appendonly yes 2>$null | Out-Null
        }
        $script:Processes.Redis = "docker:patrycloset-redis"
        Write-Log "Redis started on port $($script:Config.RedisPort)" "SUCCESS"
    }
    catch {
        Write-Log "Failed to start Redis: $_" "ERROR"
    }
}

function Start-Backend {
    Write-Log "Starting Backend API..." "STEP"
    try {
        $apiDir = Join-Path $script:Config.ServerDir "src\PatryCloset.API"
        if (-not (Test-Path $apiDir)) {
            Write-Log "Backend project not found at $apiDir" "ERROR"
            return
        }

        $logPath = Join-Path $script:Config.LogDir "backend.log"
        $errorLogPath = Join-Path $script:Config.LogDir "backend-error.log"

        $proc = Start-Process -FilePath "dotnet" `
            -ArgumentList "run", "--project", $apiDir, "--urls", $script:Config.ApiUrl `
            -WorkingDirectory $script:Config.ServerDir `
            -RedirectStandardOutput $logPath `
            -RedirectStandardError $errorLogPath `
            -PassThru -NoNewWindow

        $script:Processes.Backend = $proc
        Write-Log "Backend API starting on $($script:Config.ApiUrl) (PID: $($proc.Id))" "SUCCESS"
    }
    catch {
        Write-Log "Failed to start Backend: $_" "ERROR"
    }
}

function Start-Frontend {
    Write-Log "Starting Frontend dev server..." "STEP"
    try {
        $webDir = $script:Config.WebDir
        if (-not (Test-Path $webDir)) {
            Write-Log "Frontend project not found at $webDir" "ERROR"
            return
        }

        # Ensure node_modules exist
        if (-not (Test-Path (Join-Path $webDir "node_modules"))) {
            Write-Log "Installing frontend dependencies..." "STEP"
            Push-Location $webDir
            npm install --legacy-peer-deps 2>&1 | Out-Null
            Pop-Location
        }

        $logPath = Join-Path $script:Config.LogDir "frontend.log"
        $errorLogPath = Join-Path $script:Config.LogDir "frontend-error.log"

        $proc = Start-Process -FilePath "npm" `
            -ArgumentList "run", "dev" `
            -WorkingDirectory $webDir `
            -RedirectStandardOutput $logPath `
            -RedirectStandardError $errorLogPath `
            -PassThru -NoNewWindow

        $script:Processes.Frontend = $proc
        Write-Log "Frontend starting on $($script:Config.FrontendUrl) (PID: $($proc.Id))" "SUCCESS"
    }
    catch {
        Write-Log "Failed to start Frontend: $_" "ERROR"
    }
}

function Stop-ServiceByName {
    param([string]$ServiceName)
    Write-Log "Stopping $ServiceName..." "STEP"

    $proc = $script:Processes[$ServiceName]
    if ($null -eq $proc) {
        Write-Log "$ServiceName is not tracked as running" "WARN"
        return
    }

    try {
        if ($proc -is [string] -and $proc.StartsWith("docker:")) {
            $containerName = $proc.Replace("docker:", "")
            docker stop $containerName 2>$null | Out-Null
            Write-Log "$ServiceName stopped (Docker container: $containerName)" "SUCCESS"
        }
        elseif ($proc -is [string] -and $proc.StartsWith("service:")) {
            $svcName = $proc.Replace("service:", "")
            Stop-Service -Name $svcName -Force -ErrorAction SilentlyContinue
            Write-Log "$ServiceName stopped (Windows service: $svcName)" "SUCCESS"
        }
        elseif ($proc -is [System.Diagnostics.Process]) {
            if (-not $proc.HasExited) {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Write-Log "$ServiceName stopped (PID: $($proc.Id))" "SUCCESS"
            } else {
                Write-Log "$ServiceName had already exited" "WARN"
            }
        }
        $script:Processes[$ServiceName] = $null
    }
    catch {
        Write-Log "Error stopping ${ServiceName}: $_" "ERROR"
    }
}

function Get-ServiceStatus {
    param([string]$ServiceName)

    $proc = $script:Processes[$ServiceName]

    if ($null -eq $proc) {
        # Check if running externally (port-based detection)
        $port = switch ($ServiceName) {
            "PostgreSQL" { $script:Config.PgPort }
            "Redis"      { $script:Config.RedisPort }
            "Backend"    { 5200 }
            "Frontend"   { 5173 }
            default      { 0 }
        }
        if ($port -gt 0 -and (Test-PortInUse $port)) {
            return "Running"
        }
        return "Stopped"
    }

    if ($proc -is [string] -and $proc.StartsWith("docker:")) {
        $containerName = $proc.Replace("docker:", "")
        $running = docker ps --filter "name=$containerName" --filter "status=running" --format "{{.Names}}" 2>$null
        if ($running) { return "Running" } else { return "Stopped" }
    }

    if ($proc -is [string] -and $proc.StartsWith("service:")) {
        $svcName = $proc.Replace("service:", "")
        $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
        if ($svc -and $svc.Status -eq 'Running') { return "Running" } else { return "Stopped" }
    }

    if ($proc -is [System.Diagnostics.Process]) {
        if ($proc.HasExited) { return "Stopped" } else { return "Running" }
    }

    return "Unknown"
}

# ═══════════════════════════════════════════════════════════════
# Health & Diagnostics
# ═══════════════════════════════════════════════════════════════
function Test-ApiHealth {
    Write-Section "API Health Check"
    Write-Host ""
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri "$($script:Config.ApiUrl)/health" -TimeoutSec 5 -ErrorAction Stop
        $sw.Stop()
        $elapsed = $sw.ElapsedMilliseconds

        Write-Log "API responded in ${elapsed}ms" "SUCCESS"

        if ($response.status) {
            $level = if ($response.status -eq "Healthy") { "SUCCESS" } else { "WARN" }
            Write-Log "Status: $($response.status)" $level
        }

        if ($response.checks) {
            foreach ($check in $response.checks) {
                $level = if ($check.status -eq "Healthy") { "SUCCESS" }
                         elseif ($check.status -eq "Degraded") { "WARN" }
                         else { "ERROR" }
                Write-Log "  $($check.name): $($check.status)" $level
            }
        }
    }
    catch [System.Net.Http.HttpRequestException] {
        Write-Log "API is not reachable at $($script:Config.ApiUrl)" "ERROR"
    }
    catch {
        # Try a basic web request as fallback
        try {
            $basicResponse = Invoke-WebRequest -Uri "$($script:Config.ApiUrl)/health" -TimeoutSec 5 -ErrorAction Stop
            Write-Log "API responded with status code $($basicResponse.StatusCode)" "SUCCESS"
        }
        catch {
            Write-Log "API is not responding: $($_.Exception.Message)" "ERROR"
        }
    }
}

function Test-DatabaseConnection {
    Write-Section "Database Connection Test"
    Write-Host ""
    try {
        # Try Docker exec first
        $dockerContainer = docker ps --filter "name=patrycloset-postgres" --filter "status=running" --format "{{.Names}}" 2>$null
        if ($dockerContainer) {
            $result = docker exec patrycloset-postgres pg_isready -U $($script:Config.PgUser) 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "PostgreSQL is accepting connections (Docker)" "SUCCESS"
                return
            }
        }

        # Try native psql
        $psql = Get-Command psql -ErrorAction SilentlyContinue
        if ($psql) {
            $env:PGPASSWORD = $script:Config.PgPassword
            $null = & psql -h $script:Config.PgHost -p $script:Config.PgPort `
                -U $script:Config.PgUser -d $script:Config.PgDatabase `
                -c "SELECT 1;" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "PostgreSQL is accepting connections (native)" "SUCCESS"

                # Get table count
                $tables = & psql -h $script:Config.PgHost -p $script:Config.PgPort `
                    -U $script:Config.PgUser -d $script:Config.PgDatabase `
                    -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='patrycloset'" 2>$null
                $count = ($tables -replace '\s','')
                if ($count) {
                    Write-Log "Found $count tables in schema 'patrycloset'" "INFO"
                }
                return
            }
        }

        # Port-based check as last resort
        if (Test-PortInUse $script:Config.PgPort) {
            Write-Log "Port $($script:Config.PgPort) is active — PostgreSQL may be running" "WARN"
        } else {
            Write-Log "PostgreSQL connection failed — no service detected on port $($script:Config.PgPort)" "ERROR"
        }
    }
    catch {
        Write-Log "Database test failed: $_" "ERROR"
    }
}

function Test-RedisConnection {
    Write-Section "Redis Connection Test"
    Write-Host ""
    try {
        $dockerContainer = docker ps --filter "name=patrycloset-redis" --filter "status=running" --format "{{.Names}}" 2>$null
        if ($dockerContainer) {
            $result = docker exec patrycloset-redis redis-cli ping 2>$null
            if ($result -eq "PONG") {
                Write-Log "Redis is responding (PONG)" "SUCCESS"
                $info = docker exec patrycloset-redis redis-cli info memory 2>$null | Select-String "used_memory_human"
                if ($info) {
                    Write-Log "Memory: $($info -replace '.*:','')" "INFO"
                }
                return
            }
        }

        if (Test-PortInUse $script:Config.RedisPort) {
            Write-Log "Port $($script:Config.RedisPort) is active — Redis may be running" "WARN"
        } else {
            Write-Log "Redis not detected on port $($script:Config.RedisPort)" "ERROR"
        }
    }
    catch {
        Write-Log "Redis test failed: $_" "ERROR"
    }
}

function Show-RecentLogs {
    param([string]$ServiceName, [int]$Lines = 30)
    Write-Section "$ServiceName — Recent Logs (last $Lines lines)"

    $logMap = @{
        "Backend"    = "backend.log"
        "Frontend"   = "frontend.log"
        "PostgreSQL" = "postgresql.log"
    }

    if (-not $logMap.ContainsKey($ServiceName)) {
        Write-Log "No log mapping for $ServiceName" "WARN"
        return
    }

    $logFile = Join-Path $script:Config.LogDir $logMap[$ServiceName]
    if (Test-Path $logFile) {
        Write-Host ""
        $content = Get-Content $logFile -Tail $Lines -ErrorAction SilentlyContinue
        if ($content) {
            foreach ($line in $content) {
                $color = if ($line -match "error|fail|exception") { "`e[31m" }
                         elseif ($line -match "warn") { "`e[33m" }
                         elseif ($line -match "info|started|success|ready") { "`e[32m" }
                         else { "`e[2m" }
                Write-Host "    ${color}${line}`e[0m"
            }
        } else {
            Write-Log "Log file exists but is empty" "WARN"
        }
    }
    else {
        Write-Log "No log file found at $logFile" "WARN"
    }
}

function Invoke-DatabaseMigration {
    Write-Section "Database Migration"
    Write-Log "Running EF Core migrations..." "STEP"
    try {
        $apiDir = Join-Path $script:Config.ServerDir "src\PatryCloset.API"
        if (-not (Test-Path $apiDir)) {
            Write-Log "API project not found at $apiDir" "ERROR"
            return
        }
        $result = & dotnet ef database update --project $apiDir --startup-project $apiDir 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Database migration completed successfully" "SUCCESS"
        } else {
            Write-Log "Migration failed" "ERROR"
            $result | ForEach-Object { Write-Host "    `e[31m$_`e[0m" }
        }
    }
    catch {
        Write-Log "Migration error: $_" "ERROR"
    }
}

# ═══════════════════════════════════════════════════════════════
# Menu System
# ═══════════════════════════════════════════════════════════════
function Show-Dashboard {
    Write-Banner
    Write-Section "Service Status"
    Write-Host ""

    foreach ($svc in @("PostgreSQL", "Redis", "Backend", "Frontend")) {
        $status = Get-ServiceStatus $svc
        $details = switch ($svc) {
            "PostgreSQL" { "port $($script:Config.PgPort)" }
            "Redis"      { "port $($script:Config.RedisPort)" }
            "Backend"    { $script:Config.ApiUrl }
            "Frontend"   { $script:Config.FrontendUrl }
        }
        Write-StatusLine $svc $status $details
    }

    Write-Host ""
    Write-Section "Operations Menu"
    Write-Host ""
    Write-Host "  `e[1m[1]`e[0m  🚀 Start All Services          `e[1m[6]`e[0m  📊 API Health Check"
    Write-Host "  `e[1m[2]`e[0m  🛑 Stop All Services            `e[1m[7]`e[0m  🗄  Database Connection Test"
    Write-Host "  `e[1m[3]`e[0m  🔄 Restart All Services         `e[1m[8]`e[0m  📡 Redis Connection Test"
    Write-Host "  `e[1m[4]`e[0m  ▶  Start Individual Service     `e[1m[9]`e[0m  📋 View Backend Logs"
    Write-Host "  `e[1m[5]`e[0m  ⏹  Stop Individual Service      `e[1m[10]`e[0m 📋 View Frontend Logs"
    Write-Host ""
    Write-Host "  `e[1m[11]`e[0m 🏗  Build Backend               `e[1m[12]`e[0m 🧪 Run Tests"
    Write-Host "  `e[1m[13]`e[0m 🌐 Open Swagger UI              `e[1m[14]`e[0m 🌐 Open Frontend"
    Write-Host "  `e[1m[15]`e[0m 🔀 Run DB Migrations"
    Write-Host ""
    Write-Host "  `e[31m[0]  ❌ Exit (Stop All & Quit)`e[0m"
    Write-Host ""
}

function Select-IndividualService {
    param([string]$Action)
    Write-Host ""
    Write-Host "  `e[36mSelect service to ${Action}:`e[0m"
    Write-Host "  `e[1m[1]`e[0m PostgreSQL   `e[1m[2]`e[0m Redis   `e[1m[3]`e[0m Backend   `e[1m[4]`e[0m Frontend"
    Write-Host ""
    $choice = Read-Host "  Selection"
    switch ($choice) {
        "1" { return "PostgreSQL" }
        "2" { return "Redis" }
        "3" { return "Backend" }
        "4" { return "Frontend" }
        default {
            Write-Log "Invalid selection" "WARN"
            return $null
        }
    }
}

function Start-IndividualService {
    param([string]$ServiceName)
    switch ($ServiceName) {
        "PostgreSQL" { Start-PostgreSQL }
        "Redis"      { Start-Redis }
        "Backend"    { Start-Backend }
        "Frontend"   { Start-Frontend }
    }
}

function Start-AllServices {
    Write-Section "Starting All Services"
    Start-PostgreSQL
    Start-Sleep -Seconds 2
    Start-Redis
    Start-Sleep -Seconds 1
    Start-Backend
    Start-Sleep -Seconds 2
    Start-Frontend
    Write-Host ""
    Write-Log "All services started" "SUCCESS"
}

function Stop-AllServices {
    Write-Section "Stopping All Services"
    Stop-ServiceByName "Frontend"
    Stop-ServiceByName "Backend"
    Stop-ServiceByName "Redis"
    Stop-ServiceByName "PostgreSQL"
    Write-Host ""
    Write-Log "All services stopped" "SUCCESS"
}

function Invoke-BuildBackend {
    Write-Section "Building Backend"
    Write-Log "Running dotnet build..." "STEP"

    $slnPath = Join-Path $script:Config.ServerDir "PatryCloset.sln"
    if (-not (Test-Path $slnPath)) {
        # Try finding any .sln file
        $slnFile = Get-ChildItem -Path $script:Config.ServerDir -Filter "*.sln" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($slnFile) { $slnPath = $slnFile.FullName }
        else {
            Write-Log "No solution file found in $($script:Config.ServerDir)" "ERROR"
            return
        }
    }

    $result = & dotnet build $slnPath -c Release 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Build succeeded" "SUCCESS"
    } else {
        Write-Log "Build failed" "ERROR"
        $result | Where-Object { $_ -match "error" } | ForEach-Object {
            Write-Host "    `e[31m$_`e[0m"
        }
    }
}

function Invoke-RunTests {
    Write-Section "Running Tests"
    Write-Log "Running dotnet test..." "STEP"

    $slnPath = Join-Path $script:Config.ServerDir "PatryCloset.sln"
    if (-not (Test-Path $slnPath)) {
        $slnFile = Get-ChildItem -Path $script:Config.ServerDir -Filter "*.sln" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($slnFile) { $slnPath = $slnFile.FullName }
        else {
            Write-Log "No solution file found" "ERROR"
            return
        }
    }

    $result = & dotnet test $slnPath 2>&1
    $result | ForEach-Object {
        $color = if ($_ -match "Passed|passed|Correctas") { "`e[32m" }
                 elseif ($_ -match "error|fail|Error|Failed") { "`e[31m" }
                 else { "`e[2m" }
        Write-Host "    ${color}$_`e[0m"
    }
}

function Open-InBrowser {
    param([string]$Url)
    try {
        Start-Process $Url
        Write-Log "Opened $Url in browser" "SUCCESS"
    }
    catch {
        Write-Log "Could not open browser: $_" "WARN"
    }
}

# ═══════════════════════════════════════════════════════════════
# Main Entry Point
# ═══════════════════════════════════════════════════════════════
function Main {
    # Setup logging directory
    if (-not (Test-Path $script:Config.LogDir)) {
        New-Item -ItemType Directory -Path $script:Config.LogDir -Force | Out-Null
    }
    $script:LogFile = Join-Path $script:Config.LogDir "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

    # Authenticate
    if (-not $SkipAuth) {
        $authenticated = Invoke-Authentication
        if (-not $authenticated) {
            exit 1
        }
    }

    Write-Log "Session started — Log: $($script:LogFile)" "INFO"

    # Main loop
    $running = $true
    while ($running) {
        Show-Dashboard
        $choice = Read-Host "  Select option"

        switch ($choice) {
            "1" {
                Start-AllServices
                Read-Host "  Press Enter to continue"
            }
            "2" {
                Stop-AllServices
                Read-Host "  Press Enter to continue"
            }
            "3" {
                Stop-AllServices
                Start-Sleep -Seconds 2
                Start-AllServices
                Read-Host "  Press Enter to continue"
            }
            "4" {
                $svc = Select-IndividualService "start"
                if ($svc) { Start-IndividualService $svc }
                Read-Host "  Press Enter to continue"
            }
            "5" {
                $svc = Select-IndividualService "stop"
                if ($svc) { Stop-ServiceByName $svc }
                Read-Host "  Press Enter to continue"
            }
            "6" {
                Test-ApiHealth
                Read-Host "  Press Enter to continue"
            }
            "7" {
                Test-DatabaseConnection
                Read-Host "  Press Enter to continue"
            }
            "8" {
                Test-RedisConnection
                Read-Host "  Press Enter to continue"
            }
            "9" {
                Show-RecentLogs "Backend"
                Read-Host "  Press Enter to continue"
            }
            "10" {
                Show-RecentLogs "Frontend"
                Read-Host "  Press Enter to continue"
            }
            "11" {
                Invoke-BuildBackend
                Read-Host "  Press Enter to continue"
            }
            "12" {
                Invoke-RunTests
                Read-Host "  Press Enter to continue"
            }
            "13" {
                Open-InBrowser "$($script:Config.ApiUrl)/swagger"
            }
            "14" {
                Open-InBrowser $script:Config.FrontendUrl
            }
            "15" {
                Invoke-DatabaseMigration
                Read-Host "  Press Enter to continue"
            }
            "0" {
                Write-Host ""
                Write-Log "Shutting down all services..." "STEP"
                Stop-AllServices
                Write-Log "Session ended. Goodbye! 👋" "SUCCESS"
                $running = $false
            }
            default {
                Write-Host "  `e[33mInvalid option. Please try again.`e[0m"
                Start-Sleep -Seconds 1
            }
        }
    }
}

# Run
Main
