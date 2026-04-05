#!/usr/bin/env pwsh
#Requires -Version 7.0

<#
.SYNOPSIS
    PATRY♡CLOSET — Interactive Local Infrastructure Console v2.0
.DESCRIPTION
    Enterprise-grade local deployment and management for the Patry Closet platform.
    Opens dedicated PowerShell 7 windows per service with live logs and custom styling.
    Features: admin auth, health monitoring, migrations, build/test, live tailing.
.PARAMETER SkipAuth
    Bypass authentication (for CI/scripted usage).
.PARAMETER LogDir
    Log directory. Defaults to .\logs.
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

# ╔═══════════════════════════════════════════════════════════════╗
# ║  CONFIGURATION                                               ║
# ╚═══════════════════════════════════════════════════════════════╝
$script:Config = @{
    ProjectRoot = $PSScriptRoot
    ServerDir   = Join-Path $PSScriptRoot "patry-closet-server"
    WebDir      = Join-Path $PSScriptRoot "patry-closet-web"
    ApiProject  = Join-Path $PSScriptRoot "patry-closet-server\src\PatryCloset.API"
    SolutionFile = Join-Path $PSScriptRoot "patry-closet-server\PatryCloset.sln"
    ApiUrl      = "http://localhost:5200"
    FrontendUrl = "http://localhost:5173"
    PgHost      = "localhost"
    PgPort      = 5432
    PgUser      = "postgres"
    PgPassword  = "postgres"
    PgDatabase  = "patrycloset_dev"
    PgService   = "postgresql-x64-17"
    RedisHost   = "localhost"
    RedisPort   = 6379
    LogDir      = $LogDir
    PidDir      = Join-Path $LogDir ".pids"
    AdminUser   = "Admin"
    AdminPass   = "Admin"
}

# Track child window PIDs for cleanup
$script:ChildWindows = @{}

# ╔═══════════════════════════════════════════════════════════════╗
# ║  UI ENGINE                                                    ║
# ╚═══════════════════════════════════════════════════════════════╝
$script:Colors = @{
    Reset     = "`e[0m"
    Bold      = "`e[1m"
    Dim       = "`e[2m"
    Italic    = "`e[3m"
    Underline = "`e[4m"
    Red       = "`e[38;5;196m"
    Green     = "`e[38;5;48m"
    Yellow    = "`e[38;5;220m"
    Blue      = "`e[38;5;75m"
    Magenta   = "`e[38;5;206m"
    Cyan      = "`e[38;5;87m"
    Orange    = "`e[38;5;208m"
    Purple    = "`e[38;5;141m"
    Pink      = "`e[38;5;213m"
    Gray      = "`e[38;5;245m"
    White     = "`e[38;5;255m"
    BgDark    = "`e[48;5;235m"
}
$c = $script:Colors

function Write-Box {
    param(
        [string[]]$Lines,
        [string]$Color = $c.Magenta,
        [string]$Title = "",
        [int]$Width = 62
    )
    $inner = $Width - 2
    $top = if ($Title) {
        "$Color╔═ $($c.Bold)$Title$($c.Reset)$Color $(('═' * ($inner - $Title.Length - 3)))╗$($c.Reset)"
    } else {
        "$Color╔$(('═' * $inner))╗$($c.Reset)"
    }
    Write-Host $top
    foreach ($line in $Lines) {
        # Strip ANSI for length calculation
        $stripped = $line -replace '\e\[[0-9;]*m', ''
        $pad = $inner - $stripped.Length
        if ($pad -lt 0) { $pad = 0 }
        Write-Host "$Color║$($c.Reset) $line$((' ' * ($pad - 1)))$Color║$($c.Reset)"
    }
    Write-Host "$Color╚$(('═' * $inner))╝$($c.Reset)"
}

function Write-Banner {
    Clear-Host
    Write-Host ""
    $lines = @(
        "",
        "$($c.Bold)$($c.Pink)   ╭─────────────────────────────────────────────────╮$($c.Reset)",
        "$($c.Bold)$($c.Pink)   │                                                 │$($c.Reset)",
        "$($c.Bold)$($c.Pink)   │$($c.Reset)    $($c.Bold)$($c.White)P A T R Y  ♡  C L O S E T$($c.Reset)            $($c.Bold)$($c.Pink)│$($c.Reset)",
        "$($c.Bold)$($c.Pink)   │$($c.Reset)    $($c.Dim)Infrastructure Management Console v2.0$($c.Reset)  $($c.Bold)$($c.Pink)│$($c.Reset)",
        "$($c.Bold)$($c.Pink)   │                                                 │$($c.Reset)",
        "$($c.Bold)$($c.Pink)   ╰─────────────────────────────────────────────────╯$($c.Reset)"
    )
    $lines | ForEach-Object { Write-Host $_ }
    Write-Host ""
    Write-Host "  $($c.Dim)$(Get-Date -Format 'ddd dd MMM yyyy  HH:mm:ss')  │  PowerShell $($PSVersionTable.PSVersion)  │  PID $$($PID)$($c.Reset)"
    Write-Host ""
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $ts = Get-Date -Format "HH:mm:ss.fff"
    $icon = switch ($Level) {
        "ERROR"   { "$($c.Red)✗" }
        "WARN"    { "$($c.Yellow)⚠" }
        "SUCCESS" { "$($c.Green)✓" }
        "STEP"    { "$($c.Cyan)►" }
        "DEBUG"   { "$($c.Gray)·" }
        default   { "$($c.Gray)ℹ" }
    }
    Write-Host "  $($c.Dim)$ts$($c.Reset) $icon $Message$($c.Reset)"

    if ($script:LogFile) {
        "[$ts] [$Level] $Message" | Out-File -FilePath $script:LogFile -Append -Encoding utf8
    }
}

function Write-Separator {
    param([string]$Title = "")
    if ($Title) {
        $line = "─" * (56 - $Title.Length)
        Write-Host "  $($c.Dim)──── $($c.Reset)$($c.Bold)$Title $($c.Dim)$line$($c.Reset)"
    } else {
        Write-Host "  $($c.Dim)$('─' * 60)$($c.Reset)"
    }
}

function Write-ProgressBar {
    param([int]$Current, [int]$Total, [string]$Label = "", [int]$Width = 30)
    $pct = if ($Total -gt 0) { [math]::Round(($Current / $Total) * 100) } else { 0 }
    $filled = [math]::Round(($pct / 100) * $Width)
    $empty = $Width - $filled
    $bar = "$($c.Green)$('█' * $filled)$($c.Dim)$('░' * $empty)$($c.Reset)"
    Write-Host "  $bar $($c.Bold)$pct%$($c.Reset) $($c.Dim)$Label$($c.Reset)"
}

# ╔═══════════════════════════════════════════════════════════════╗
# ║  AUTHENTICATION                                               ║
# ╚═══════════════════════════════════════════════════════════════╝
function Invoke-Authentication {
    Write-Banner
    Write-Host ""
    Write-Box -Lines @(
        "$($c.Yellow)  🔐  Authentication Required$($c.Reset)",
        "",
        "  Enter your admin credentials to access",
        "  the infrastructure management console."
    ) -Color $c.Yellow -Title "Security"
    Write-Host ""

    for ($attempt = 1; $attempt -le 3; $attempt++) {
        Write-Host "  $($c.Dim)Attempt $attempt of 3$($c.Reset)"
        $user = Read-Host "  $($c.Cyan)Username$($c.Reset)"
        $pass = Read-Host "  $($c.Cyan)Password$($c.Reset)" -MaskInput

        if ($user -eq $script:Config.AdminUser -and $pass -eq $script:Config.AdminPass) {
            Write-Host ""
            Write-Log "Access granted — Welcome, $user" "SUCCESS"
            Start-Sleep -Milliseconds 800
            return $true
        }

        $remaining = 3 - $attempt
        if ($remaining -gt 0) {
            Write-Log "Invalid credentials. $remaining attempt(s) remaining." "ERROR"
            Write-Host ""
        }
    }

    Write-Host ""
    Write-Log "Access denied — session terminated." "ERROR"
    Start-Sleep -Seconds 2
    return $false
}

# ╔═══════════════════════════════════════════════════════════════╗
# ║  PORT & PROCESS UTILITIES                                     ║
# ╚═══════════════════════════════════════════════════════════════╝
function Test-PortInUse([int]$Port) {
    $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Get-ProcessOnPort([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        return Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    }
    return $null
}

function Save-Pid([string]$Service, [int]$Pid) {
    $pidFile = Join-Path $script:Config.PidDir "$Service.pid"
    $Pid | Out-File -FilePath $pidFile -Force -NoNewline
}

function Get-SavedPid([string]$Service) {
    $pidFile = Join-Path $script:Config.PidDir "$Service.pid"
    if (Test-Path $pidFile) {
        $pid = Get-Content $pidFile -Raw -ErrorAction SilentlyContinue
        if ($pid -and $pid -match '^\d+$') {
            return [int]$pid
        }
    }
    return 0
}

function Remove-PidFile([string]$Service) {
    $pidFile = Join-Path $script:Config.PidDir "$Service.pid"
    Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}

function Stop-ProcessSafely([int]$ProcessId, [string]$Label = "process") {
    try {
        $proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        if ($proc -and !$proc.HasExited) {
            # Kill the process tree
            Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
            # Wait briefly for cleanup
            Start-Sleep -Milliseconds 500
            Write-Log "$Label stopped (PID: $ProcessId)" "SUCCESS"
            return $true
        } else {
            Write-Log "$Label was not running (PID: $ProcessId)" "WARN"
            return $false
        }
    } catch {
        Write-Log "Error stopping ${Label}: $_" "ERROR"
        return $false
    }
}

# ╔═══════════════════════════════════════════════════════════════╗
# ║  SERVICE WINDOW LAUNCHERS                                     ║
# ╚═══════════════════════════════════════════════════════════════╝

function Open-ServiceWindow {
    <#
    .SYNOPSIS
        Opens a dedicated PowerShell 7 window for a service with custom title and live output.
    #>
    param(
        [string]$ServiceName,
        [string]$Title,
        [string]$WorkingDir,
        [string]$ScriptBlock,
        [string]$TitleColor = "Magenta"
    )

    $logPath = Join-Path $script:Config.LogDir "$($ServiceName.ToLower()).log"

    # Build the inner script that runs in the new window
    $innerScript = @"
`$Host.UI.RawUI.WindowTitle = '$Title'
Set-Location '$WorkingDir'

# Banner
Write-Host ''
Write-Host '  `e[1m`e[38;5;213m╭────────────────────────────────────────────────╮`e[0m'
Write-Host '  `e[1m`e[38;5;213m│`e[0m  `e[1mPATRY♡CLOSET`e[0m — $ServiceName Console            `e[1m`e[38;5;213m│`e[0m'
Write-Host '  `e[1m`e[38;5;213m╰────────────────────────────────────────────────╯`e[0m'
Write-Host ''
Write-Host "  `e[2mStarted: `$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`e[0m"
Write-Host "  `e[2mLog:     $logPath`e[0m"
Write-Host "  `e[2mPID:     `$PID`e[0m"
Write-Host ''
Write-Host '  `e[36m► Starting service...`e[0m'
Write-Host ''

$ScriptBlock

Write-Host ''
Write-Host '  `e[33m⚠ Service exited. Window will stay open for inspection.`e[0m'
Write-Host '  `e[2mPress any key to close...`e[0m'
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@

    # Write the script to a temp file (avoids escaping nightmares)
    $tempScript = Join-Path $script:Config.LogDir "$($ServiceName.ToLower())-launcher.ps1"
    $innerScript | Out-File -FilePath $tempScript -Encoding utf8 -Force

    # Launch in a new pwsh window
    $proc = Start-Process -FilePath "pwsh" `
        -ArgumentList "-NoExit", "-NoProfile", "-File", $tempScript `
        -WorkingDirectory $WorkingDir `
        -PassThru

    $script:ChildWindows[$ServiceName] = $proc.Id
    Save-Pid $ServiceName $proc.Id
    return $proc
}

# ── PostgreSQL ───────────────────────────────────────────────
function Start-PostgreSQL {
    Write-Log "Starting PostgreSQL..." "STEP"
    try {
        $pgSvc = Get-Service -Name $script:Config.PgService -ErrorAction SilentlyContinue
        if ($pgSvc) {
            if ($pgSvc.Status -eq 'Running') {
                Write-Log "PostgreSQL already running (Windows service: $($script:Config.PgService))" "SUCCESS"
                return $true
            }
            Start-Service -Name $script:Config.PgService -ErrorAction Stop
            Start-Sleep -Seconds 2
            Write-Log "PostgreSQL started via Windows service on port $($script:Config.PgPort)" "SUCCESS"
            return $true
        }

        # Docker fallback
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
            Start-Sleep -Seconds 3
            Write-Log "PostgreSQL started via Docker on port $($script:Config.PgPort)" "SUCCESS"
            return $true
        }

        Write-Log "No PostgreSQL service or Docker found" "ERROR"
        return $false
    }
    catch {
        Write-Log "Failed to start PostgreSQL: $_" "ERROR"
        return $false
    }
}

function Stop-PostgreSQL {
    Write-Log "Stopping PostgreSQL..." "STEP"
    try {
        $pgSvc = Get-Service -Name $script:Config.PgService -ErrorAction SilentlyContinue
        if ($pgSvc -and $pgSvc.Status -eq 'Running') {
            Stop-Service -Name $script:Config.PgService -Force -ErrorAction SilentlyContinue
            Write-Log "PostgreSQL Windows service stopped" "SUCCESS"
            return
        }
        $dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
        if ($dockerAvailable) {
            docker stop patrycloset-postgres 2>$null | Out-Null
            Write-Log "PostgreSQL Docker container stopped" "SUCCESS"
            return
        }
        Write-Log "No PostgreSQL to stop" "WARN"
    }
    catch {
        Write-Log "Error stopping PostgreSQL: $_" "ERROR"
    }
}

# ── Redis ────────────────────────────────────────────────────
function Start-Redis {
    Write-Log "Starting Redis..." "STEP"
    try {
        $dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
        if (-not $dockerAvailable) {
            Write-Log "Docker not available — skipping Redis (optional)" "WARN"
            return $false
        }
        $existing = docker ps -a --filter "name=patrycloset-redis" --format "{{.Names}}" 2>$null
        if ($existing) {
            docker start patrycloset-redis 2>$null | Out-Null
        } else {
            docker run -d --name patrycloset-redis `
                -p "$($script:Config.RedisPort):6379" `
                redis:7-alpine redis-server --appendonly yes 2>$null | Out-Null
        }
        Start-Sleep -Seconds 1
        Write-Log "Redis started on port $($script:Config.RedisPort)" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Failed to start Redis: $_" "ERROR"
        return $false
    }
}

function Stop-Redis {
    Write-Log "Stopping Redis..." "STEP"
    try {
        $dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
        if ($dockerAvailable) {
            docker stop patrycloset-redis 2>$null | Out-Null
            Write-Log "Redis stopped" "SUCCESS"
        }
    }
    catch {
        Write-Log "Error stopping Redis: $_" "ERROR"
    }
}

# ── Backend API ──────────────────────────────────────────────
function Start-BackendWindow {
    Write-Log "Launching Backend API window..." "STEP"

    $apiDir = $script:Config.ApiProject
    if (-not (Test-Path $apiDir)) {
        Write-Log "Backend project not found at $apiDir" "ERROR"
        return $false
    }

    # Kill any existing backend on the port
    $existing = Get-ProcessOnPort 5200
    if ($existing) {
        Write-Log "Port 5200 in use by PID $($existing.Id) — stopping..." "WARN"
        Stop-ProcessSafely $existing.Id "existing backend"
        Start-Sleep -Seconds 1
    }

    $logFile = Join-Path $script:Config.LogDir "backend.log"

    $cmd = @"
try {
    `$env:ASPNETCORE_URLS = 'http://localhost:5200'
    `$env:ASPNETCORE_ENVIRONMENT = 'Development'
    `$env:DOTNET_WATCH_RESTART_ON_RUDE_EDIT = 'true'

    # Tee output to both console and log file
    & dotnet run --project '$apiDir' --urls 'http://localhost:5200' 2>&1 | ForEach-Object {
        `$line = `$_.ToString()
        `$color = if (`$line -match 'fail|error|exception|crit') { '`e[31m' }
                 elseif (`$line -match 'warn') { '`e[33m' }
                 elseif (`$line -match 'info.*started|listening|ready|applied|healthy') { '`e[32m' }
                 elseif (`$line -match 'dbug|trce') { '`e[2m' }
                 else { '' }
        Write-Host "  `$color`$line`e[0m"
        `$line | Out-File -FilePath '$logFile' -Append -Encoding utf8
    }
} catch {
    Write-Host "  `e[31m✗ Backend crashed: `$_`e[0m"
}
"@

    Open-ServiceWindow -ServiceName "Backend" `
        -Title "PATRY♡CLOSET — Backend API (port 5200)" `
        -WorkingDir $script:Config.ServerDir `
        -ScriptBlock $cmd

    # Wait for startup
    Write-Log "Waiting for Backend API to start..." "STEP"
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-PortInUse 5200) {
            $ready = $true
            break
        }
    }

    if ($ready) {
        Write-Log "Backend API is listening on $($script:Config.ApiUrl)" "SUCCESS"
    } else {
        Write-Log "Backend API did not start within 30s — check the backend window" "WARN"
    }
    return $ready
}

function Stop-BackendWindow {
    Write-Log "Stopping Backend..." "STEP"

    # Stop the dotnet process on port 5200
    $proc = Get-ProcessOnPort 5200
    if ($proc) {
        Stop-ProcessSafely $proc.Id "Backend API"
    }

    # Close the window
    $windowPid = Get-SavedPid "Backend"
    if ($windowPid -gt 0) {
        Stop-ProcessSafely $windowPid "Backend window" | Out-Null
        Remove-PidFile "Backend"
    }
    $script:ChildWindows.Remove("Backend")
}

# ── Frontend ─────────────────────────────────────────────────
function Start-FrontendWindow {
    Write-Log "Launching Frontend dev server window..." "STEP"

    $webDir = $script:Config.WebDir
    if (-not (Test-Path $webDir)) {
        Write-Log "Frontend project not found at $webDir" "ERROR"
        return $false
    }

    # Install deps if needed
    if (-not (Test-Path (Join-Path $webDir "node_modules"))) {
        Write-Log "Installing frontend dependencies (first time)..." "STEP"
        Push-Location $webDir
        npm install --legacy-peer-deps 2>&1 | Out-Null
        Pop-Location
        Write-Log "Dependencies installed" "SUCCESS"
    }

    # Kill any existing frontend on the port
    $existing = Get-ProcessOnPort 5173
    if ($existing) {
        Write-Log "Port 5173 in use by PID $($existing.Id) — stopping..." "WARN"
        Stop-ProcessSafely $existing.Id "existing frontend"
        Start-Sleep -Seconds 1
    }

    $logFile = Join-Path $script:Config.LogDir "frontend.log"

    $cmd = @"
try {
    & npm run dev 2>&1 | ForEach-Object {
        `$line = `$_.ToString()
        `$color = if (`$line -match 'error|ERR!') { '`e[31m' }
                 elseif (`$line -match 'warn|WARN') { '`e[33m' }
                 elseif (`$line -match 'ready|Local:|Network:|VITE') { '`e[32m' }
                 elseif (`$line -match 'hmr|update') { '`e[36m' }
                 else { '' }
        Write-Host "  `$color`$line`e[0m"
        `$line | Out-File -FilePath '$logFile' -Append -Encoding utf8
    }
} catch {
    Write-Host "  `e[31m✗ Frontend crashed: `$_`e[0m"
}
"@

    Open-ServiceWindow -ServiceName "Frontend" `
        -Title "PATRY♡CLOSET — Frontend Dev Server (port 5173)" `
        -WorkingDir $webDir `
        -ScriptBlock $cmd

    Write-Log "Waiting for Frontend dev server..." "STEP"
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        if (Test-PortInUse 5173) {
            $ready = $true
            break
        }
    }

    if ($ready) {
        Write-Log "Frontend is listening on $($script:Config.FrontendUrl)" "SUCCESS"
    } else {
        Write-Log "Frontend did not start within 20s — check the frontend window" "WARN"
    }
    return $ready
}

function Stop-FrontendWindow {
    Write-Log "Stopping Frontend..." "STEP"

    $proc = Get-ProcessOnPort 5173
    if ($proc) {
        Stop-ProcessSafely $proc.Id "Frontend dev server"
    }

    # Also stop any node processes from our working dir
    $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue |
        Where-Object { $_.Path -and $_.MainModule.FileName -match "node" }
    # Don't kill all node processes — just the window
    $windowPid = Get-SavedPid "Frontend"
    if ($windowPid -gt 0) {
        Stop-ProcessSafely $windowPid "Frontend window" | Out-Null
        Remove-PidFile "Frontend"
    }
    $script:ChildWindows.Remove("Frontend")
}

# ── Database Console ─────────────────────────────────────────
function Open-DatabaseConsole {
    Write-Log "Opening Database console..." "STEP"

    $logFile = Join-Path $script:Config.LogDir "database.log"

    $cmd = @"
Write-Host '  `e[36m► Connecting to PostgreSQL...'
Write-Host '    Host:     $($script:Config.PgHost):$($script:Config.PgPort)'
Write-Host '    Database: $($script:Config.PgDatabase)'
Write-Host '    User:     $($script:Config.PgUser)'
Write-Host '`e[0m'

`$env:PGPASSWORD = '$($script:Config.PgPassword)'

# Check if psql is available
`$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
if (-not `$psqlCmd) {
    Write-Host '  `e[33m⚠ psql not found in PATH`e[0m'
    Write-Host ''
    Write-Host '  `e[2mAttempting to find PostgreSQL installation...`e[0m'
    `$pgPaths = @(
        'C:\Program Files\PostgreSQL\17\bin',
        'C:\Program Files\PostgreSQL\16\bin',
        'C:\Program Files\PostgreSQL\15\bin'
    )
    foreach (`$p in `$pgPaths) {
        if (Test-Path (Join-Path `$p 'psql.exe')) {
            `$env:PATH = "`$p;`$env:PATH"
            Write-Host "  `e[32m✓ Found psql at `$p`e[0m"
            `$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
            break
        }
    }
    if (-not `$psqlCmd) {
        Write-Host '  `e[31m✗ PostgreSQL client tools not found.`e[0m'
        Write-Host '  `e[2m  Install from: https://www.postgresql.org/download/`e[0m'
        Write-Host ''
        Write-Host '  Falling back to port monitoring mode...'
        Write-Host ''
        while (`$true) {
            `$conn = Get-NetTCPConnection -LocalPort $($script:Config.PgPort) -State Listen -ErrorAction SilentlyContinue
            if (`$conn) {
                Write-Host "  `e[32m●`e[0m `e[2m`$(Get-Date -Format 'HH:mm:ss')`e[0m PostgreSQL listening on port $($script:Config.PgPort)"
            } else {
                Write-Host "  `e[31m○`e[0m `e[2m`$(Get-Date -Format 'HH:mm:ss')`e[0m PostgreSQL NOT listening"
            }
            Start-Sleep -Seconds 5
        }
        return
    }
}

Write-Host '  `e[32m✓ Connected to PostgreSQL`e[0m'
Write-Host ''
Write-Host '  `e[2m────────────────────────────────────────────`e[0m'
Write-Host '  `e[1mUseful commands:`e[0m'
Write-Host '  `e[36m  \dt patrycloset.*`e[0m  — List all tables'
Write-Host '  `e[36m  \d+ patrycloset.Products`e[0m  — Describe table'
Write-Host '  `e[36m  SELECT count(*) FROM patrycloset."Products";`e[0m'
Write-Host '  `e[36m  \q`e[0m  — Quit'
Write-Host '  `e[2m────────────────────────────────────────────`e[0m'
Write-Host ''

& psql -h $($script:Config.PgHost) -p $($script:Config.PgPort) -U $($script:Config.PgUser) -d $($script:Config.PgDatabase)
"@

    Open-ServiceWindow -ServiceName "Database" `
        -Title "PATRY♡CLOSET — PostgreSQL Console" `
        -WorkingDir $script:Config.ProjectRoot `
        -ScriptBlock $cmd

    Write-Log "Database console window opened" "SUCCESS"
}

function Close-DatabaseConsole {
    $windowPid = Get-SavedPid "Database"
    if ($windowPid -gt 0) {
        Stop-ProcessSafely $windowPid "Database console" | Out-Null
        Remove-PidFile "Database"
    }
    $script:ChildWindows.Remove("Database")
}

# ╔═══════════════════════════════════════════════════════════════╗
# ║  SERVICE STATUS                                               ║
# ╚═══════════════════════════════════════════════════════════════╝
function Get-ServiceStatus([string]$Name) {
    switch ($Name) {
        "PostgreSQL" {
            $svc = Get-Service -Name $script:Config.PgService -ErrorAction SilentlyContinue
            if ($svc -and $svc.Status -eq 'Running') { return @{ Status = "Running"; Detail = "Windows service" } }
            $docker = docker ps --filter "name=patrycloset-postgres" --filter "status=running" --format "{{.Names}}" 2>$null
            if ($docker) { return @{ Status = "Running"; Detail = "Docker container" } }
            if (Test-PortInUse $script:Config.PgPort) { return @{ Status = "Running"; Detail = "port $($script:Config.PgPort)" } }
            return @{ Status = "Stopped"; Detail = "" }
        }
        "Redis" {
            $docker = docker ps --filter "name=patrycloset-redis" --filter "status=running" --format "{{.Names}}" 2>$null
            if ($docker) { return @{ Status = "Running"; Detail = "Docker container" } }
            if (Test-PortInUse $script:Config.RedisPort) { return @{ Status = "Running"; Detail = "port $($script:Config.RedisPort)" } }
            return @{ Status = "Stopped"; Detail = "" }
        }
        "Backend" {
            if (Test-PortInUse 5200) { return @{ Status = "Running"; Detail = "http://localhost:5200" } }
            return @{ Status = "Stopped"; Detail = "" }
        }
        "Frontend" {
            if (Test-PortInUse 5173) { return @{ Status = "Running"; Detail = "http://localhost:5173" } }
            return @{ Status = "Stopped"; Detail = "" }
        }
    }
    return @{ Status = "Unknown"; Detail = "" }
}

function Show-ServiceStatus {
    $services = @("PostgreSQL", "Redis", "Backend", "Frontend")
    $portMap = @{ PostgreSQL = $script:Config.PgPort; Redis = $script:Config.RedisPort; Backend = 5200; Frontend = 5173 }

    foreach ($svc in $services) {
        $info = Get-ServiceStatus $svc
        $status = $info.Status
        $detail = $info.Detail
        $port = $portMap[$svc]

        $icon = switch ($status) {
            "Running" { "$($c.Green)●" }
            "Stopped" { "$($c.Red)○" }
            default   { "$($c.Yellow)◌" }
        }

        $statusText = switch ($status) {
            "Running" { "$($c.Green)Running$($c.Reset)" }
            "Stopped" { "$($c.Red)Stopped$($c.Reset)" }
            default   { "$($c.Yellow)$status$($c.Reset)" }
        }

        $portText = "$($c.Dim):$port$($c.Reset)"
        $detailText = if ($detail) { "$($c.Dim)($detail)$($c.Reset)" } else { "" }
        $paddedName = $svc.PadRight(12)

        Write-Host "    $icon $($c.Bold)$paddedName$($c.Reset) $portText  $statusText  $detailText"
    }
}

# ╔═══════════════════════════════════════════════════════════════╗
# ║  HEALTH & DIAGNOSTICS                                         ║
# ╚═══════════════════════════════════════════════════════════════╝
function Test-ApiHealth {
    Write-Host ""
    Write-Separator "API Health Check"
    Write-Host ""
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri "$($script:Config.ApiUrl)/health" -TimeoutSec 5 -ErrorAction Stop
        $sw.Stop()

        Write-Log "API responded in $($sw.ElapsedMilliseconds)ms" "SUCCESS"

        if ($response.status) {
            $level = if ($response.status -eq "Healthy") { "SUCCESS" } else { "WARN" }
            Write-Log "Status: $($response.status)" $level
        }
        if ($response.checks) {
            foreach ($check in $response.checks) {
                $level = switch ($check.status) {
                    "Healthy"  { "SUCCESS" }
                    "Degraded" { "WARN" }
                    default    { "ERROR" }
                }
                Write-Log "  $($check.name): $($check.status)" $level
            }
        }
    }
    catch {
        try {
            $basicResponse = Invoke-WebRequest -Uri "$($script:Config.ApiUrl)/health" -TimeoutSec 5 -ErrorAction Stop
            Write-Log "API responded with HTTP $($basicResponse.StatusCode)" "SUCCESS"
        }
        catch {
            Write-Log "API not reachable at $($script:Config.ApiUrl)/health" "ERROR"
            Write-Log "  $($_.Exception.Message)" "DEBUG"
        }
    }
}

function Test-DatabaseConnection {
    Write-Host ""
    Write-Separator "Database Connection"
    Write-Host ""
    try {
        # Docker check
        $dockerContainer = docker ps --filter "name=patrycloset-postgres" --filter "status=running" --format "{{.Names}}" 2>$null
        if ($dockerContainer) {
            $result = docker exec patrycloset-postgres pg_isready -U $($script:Config.PgUser) 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "PostgreSQL accepting connections (Docker)" "SUCCESS"
                return
            }
        }

        # Native psql
        $psql = Get-Command psql -ErrorAction SilentlyContinue
        if (-not $psql) {
            # Auto-find psql
            @("C:\Program Files\PostgreSQL\17\bin", "C:\Program Files\PostgreSQL\16\bin") | ForEach-Object {
                if (Test-Path "$_\psql.exe") { $env:PATH = "$_;$env:PATH" }
            }
            $psql = Get-Command psql -ErrorAction SilentlyContinue
        }

        if ($psql) {
            $env:PGPASSWORD = $script:Config.PgPassword
            $null = & psql -h $script:Config.PgHost -p $script:Config.PgPort `
                -U $script:Config.PgUser -d $script:Config.PgDatabase -c "SELECT 1;" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "PostgreSQL accepting connections (native)" "SUCCESS"
                $tables = & psql -h $script:Config.PgHost -p $script:Config.PgPort `
                    -U $script:Config.PgUser -d $script:Config.PgDatabase `
                    -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='patrycloset'" 2>$null
                $count = ($tables -replace '\s','')
                if ($count) { Write-Log "Schema 'patrycloset' has $count tables" "INFO" }
                return
            }
        }

        if (Test-PortInUse $script:Config.PgPort) {
            Write-Log "Port $($script:Config.PgPort) active — PostgreSQL may be running" "WARN"
        } else {
            Write-Log "PostgreSQL not detected on port $($script:Config.PgPort)" "ERROR"
        }
    }
    catch {
        Write-Log "Database test failed: $_" "ERROR"
    }
}

function Test-RedisConnection {
    Write-Host ""
    Write-Separator "Redis Connection"
    Write-Host ""
    try {
        $dockerContainer = docker ps --filter "name=patrycloset-redis" --filter "status=running" --format "{{.Names}}" 2>$null
        if ($dockerContainer) {
            $result = docker exec patrycloset-redis redis-cli ping 2>$null
            if ($result -eq "PONG") {
                Write-Log "Redis responding (PONG)" "SUCCESS"
                $info = docker exec patrycloset-redis redis-cli info memory 2>$null | Select-String "used_memory_human"
                if ($info) { Write-Log "Memory: $($info -replace '.*:','')" "INFO" }
                return
            }
        }
        if (Test-PortInUse $script:Config.RedisPort) {
            Write-Log "Port $($script:Config.RedisPort) active — Redis may be running" "WARN"
        } else {
            Write-Log "Redis not detected (optional service)" "WARN"
        }
    }
    catch {
        Write-Log "Redis test failed: $_" "ERROR"
    }
}

function Show-LiveLogs {
    param([string]$ServiceName, [int]$Lines = 40)
    Write-Host ""
    Write-Separator "$ServiceName Logs (last $Lines lines)"
    Write-Host ""

    $logMap = @{
        "Backend"  = "backend.log"
        "Frontend" = "frontend.log"
    }

    if (-not $logMap.ContainsKey($ServiceName)) {
        Write-Log "No log mapping for $ServiceName" "WARN"
        return
    }

    $logFile = Join-Path $script:Config.LogDir $logMap[$ServiceName]
    if (-not (Test-Path $logFile)) {
        Write-Log "No log file found — service may not have been started yet" "WARN"
        return
    }

    $content = Get-Content $logFile -Tail $Lines -ErrorAction SilentlyContinue
    if (-not $content -or $content.Count -eq 0) {
        Write-Log "Log file is empty" "WARN"
        return
    }

    foreach ($line in $content) {
        $color = if ($line -match "error|fail|exception|crit") { $c.Red }
                 elseif ($line -match "warn") { $c.Yellow }
                 elseif ($line -match "info.*start|listen|ready|success|applied|healthy") { $c.Green }
                 elseif ($line -match "GET|POST|PUT|DELETE") { $c.Cyan }
                 else { $c.Dim }
        Write-Host "    $color$line$($c.Reset)"
    }

    $size = (Get-Item $logFile).Length
    $sizeText = if ($size -gt 1MB) { "$([math]::Round($size / 1MB, 1)) MB" }
                elseif ($size -gt 1KB) { "$([math]::Round($size / 1KB, 1)) KB" }
                else { "$size B" }
    Write-Host ""
    Write-Log "Log size: $sizeText — $logFile" "DEBUG"
}

# ╔═══════════════════════════════════════════════════════════════╗
# ║  BUILD & MIGRATIONS                                           ║
# ╚═══════════════════════════════════════════════════════════════╝
function Invoke-BuildBackend {
    Write-Host ""
    Write-Separator "Backend Build"
    Write-Host ""
    Write-Log "Running dotnet build (Release)..." "STEP"

    $slnPath = $script:Config.SolutionFile
    if (-not (Test-Path $slnPath)) {
        $slnFile = Get-ChildItem -Path $script:Config.ServerDir -Filter "*.sln" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($slnFile) { $slnPath = $slnFile.FullName }
        else {
            Write-Log "No solution file found" "ERROR"
            return
        }
    }

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $result = & dotnet build $slnPath -c Release --verbosity quiet 2>&1
    $sw.Stop()

    if ($LASTEXITCODE -eq 0) {
        Write-Log "Build succeeded in $($sw.ElapsedMilliseconds)ms" "SUCCESS"
    } else {
        Write-Log "Build FAILED" "ERROR"
        $result | Where-Object { $_ -match "error|Error" } | ForEach-Object {
            Write-Host "    $($c.Red)$_$($c.Reset)"
        }
    }
}

function Invoke-RunTests {
    Write-Host ""
    Write-Separator "Test Suite"
    Write-Host ""
    Write-Log "Running dotnet test..." "STEP"

    $slnPath = $script:Config.SolutionFile
    if (-not (Test-Path $slnPath)) {
        $slnFile = Get-ChildItem -Path $script:Config.ServerDir -Filter "*.sln" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($slnFile) { $slnPath = $slnFile.FullName }
        else {
            Write-Log "No solution file found" "ERROR"
            return
        }
    }

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $result = & dotnet test $slnPath --verbosity minimal 2>&1
    $sw.Stop()

    $passed = 0; $failed = 0; $skipped = 0
    $result | ForEach-Object {
        $line = $_.ToString()
        if ($line -match '(\d+)\s+(Passed|Correctas)') { $passed += [int]$Matches[1] }
        if ($line -match '(\d+)\s+(Failed|Con errores)') { $failed += [int]$Matches[1] }
        if ($line -match '(\d+)\s+(Skipped|Omitidas)') { $skipped += [int]$Matches[1] }

        $color = if ($line -match "Passed|passed|Correctas") { $c.Green }
                 elseif ($line -match "error|fail|Error|Failed") { $c.Red }
                 elseif ($line -match "skip|Skipped") { $c.Yellow }
                 else { $c.Dim }
        Write-Host "    $color$line$($c.Reset)"
    }

    Write-Host ""
    $total = $passed + $failed + $skipped
    if ($total -gt 0) {
        Write-Log "Results: $($c.Green)$passed passed$($c.Reset), $($c.Red)$failed failed$($c.Reset), $($c.Yellow)$skipped skipped$($c.Reset) ($($sw.ElapsedMilliseconds)ms)" "INFO"
    }
}

function Invoke-DatabaseMigration {
    Write-Host ""
    Write-Separator "Database Migration"
    Write-Host ""
    Write-Log "Running EF Core migrations..." "STEP"

    $apiDir = $script:Config.ApiProject
    if (-not (Test-Path $apiDir)) {
        Write-Log "API project not found" "ERROR"
        return
    }

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $result = & dotnet ef database update --project $apiDir --startup-project $apiDir 2>&1
    $sw.Stop()

    if ($LASTEXITCODE -eq 0) {
        Write-Log "Migration completed in $($sw.ElapsedMilliseconds)ms" "SUCCESS"
    } else {
        Write-Log "Migration FAILED" "ERROR"
        $result | ForEach-Object { Write-Host "    $($c.Red)$_$($c.Reset)" }
    }
}

function Invoke-BuildFrontend {
    Write-Host ""
    Write-Separator "Frontend Build"
    Write-Host ""
    Write-Log "Running Vite production build..." "STEP"

    $webDir = $script:Config.WebDir
    Push-Location $webDir
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $result = & npx vite build 2>&1
    $sw.Stop()
    Pop-Location

    if ($LASTEXITCODE -eq 0) {
        Write-Log "Frontend built in $($sw.ElapsedMilliseconds)ms" "SUCCESS"
        # Show chunk summary
        $result | Where-Object { $_ -match "dist/" } | Select-Object -Last 10 | ForEach-Object {
            Write-Host "    $($c.Dim)$_$($c.Reset)"
        }
    } else {
        Write-Log "Frontend build FAILED" "ERROR"
        $result | Where-Object { $_ -match "error|Error" } | ForEach-Object {
            Write-Host "    $($c.Red)$_$($c.Reset)"
        }
    }
}

# ╔═══════════════════════════════════════════════════════════════╗
# ║  ORCHESTRATION                                                ║
# ╚═══════════════════════════════════════════════════════════════╝
function Start-AllServices {
    Write-Host ""
    Write-Separator "Starting All Services"
    Write-Host ""

    $steps = @(
        @{ Name = "PostgreSQL"; Fn = { Start-PostgreSQL } },
        @{ Name = "Redis";      Fn = { Start-Redis } },
        @{ Name = "Backend";    Fn = { Start-BackendWindow } },
        @{ Name = "Frontend";   Fn = { Start-FrontendWindow } }
    )

    $total = $steps.Count
    for ($i = 0; $i -lt $total; $i++) {
        $step = $steps[$i]
        Write-ProgressBar ($i) $total $step.Name
        & $step.Fn | Out-Null
    }
    Write-ProgressBar $total $total "Complete"
    Write-Host ""
    Write-Log "All services started — check individual windows for live logs" "SUCCESS"
}

function Stop-AllServices {
    Write-Host ""
    Write-Separator "Stopping All Services"
    Write-Host ""

    Stop-FrontendWindow
    Stop-BackendWindow
    Stop-Redis
    Stop-PostgreSQL
    Close-DatabaseConsole

    Write-Host ""
    Write-Log "All services stopped" "SUCCESS"
}

function Open-InBrowser([string]$Url) {
    try {
        Start-Process $Url
        Write-Log "Opened $Url" "SUCCESS"
    }
    catch {
        Write-Log "Could not open browser: $_" "WARN"
    }
}

# ╔═══════════════════════════════════════════════════════════════╗
# ║  INTERACTIVE MENU                                             ║
# ╚═══════════════════════════════════════════════════════════════╝
function Show-Dashboard {
    Write-Banner

    Write-Separator "Services"
    Write-Host ""
    Show-ServiceStatus
    Write-Host ""

    # Check for open console windows
    $openWindows = @()
    foreach ($key in $script:ChildWindows.Keys) {
        $pid = $script:ChildWindows[$key]
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc -and !$proc.HasExited) { $openWindows += $key }
    }
    if ($openWindows.Count -gt 0) {
        Write-Host "    $($c.Dim)Console windows: $($openWindows -join ', ')$($c.Reset)"
        Write-Host ""
    }

    Write-Separator "Operations"
    Write-Host ""
    Write-Host "    $($c.Bold)$($c.Green) 1$($c.Reset)  🚀 Start All Services       $($c.Bold)$($c.Blue) 8$($c.Reset)  📊 API Health Check"
    Write-Host "    $($c.Bold)$($c.Red) 2$($c.Reset)  🛑 Stop All Services        $($c.Bold)$($c.Blue) 9$($c.Reset)  🗄  Database Test"
    Write-Host "    $($c.Bold)$($c.Yellow) 3$($c.Reset)  🔄 Restart All Services     $($c.Bold)$($c.Blue)10$($c.Reset)  📡 Redis Test"
    Write-Host ""
    Write-Host "    $($c.Bold)$($c.Cyan) 4$($c.Reset)  ▶  Start Service             $($c.Bold)$($c.Purple)11$($c.Reset)  📋 Backend Logs"
    Write-Host "    $($c.Bold)$($c.Cyan) 5$($c.Reset)  ⏹  Stop Service              $($c.Bold)$($c.Purple)12$($c.Reset)  📋 Frontend Logs"
    Write-Host ""
    Write-Host "    $($c.Bold)$($c.Orange) 6$($c.Reset)  🏗  Build Backend             $($c.Bold)$($c.Orange)13$($c.Reset)  🏗  Build Frontend"
    Write-Host "    $($c.Bold)$($c.Orange) 7$($c.Reset)  🧪 Run Tests                 $($c.Bold)$($c.Orange)14$($c.Reset)  🔀 DB Migrations"
    Write-Host ""
    Write-Host "    $($c.Bold)$($c.White)15$($c.Reset)  🌐 Open Swagger UI           $($c.Bold)$($c.White)17$($c.Reset)  🖥  Database Console"
    Write-Host "    $($c.Bold)$($c.White)16$($c.Reset)  🌐 Open Frontend             $($c.Bold)$($c.White)18$($c.Reset)  📁 Open Log Folder"
    Write-Host ""
    Write-Host "    $($c.Red)$($c.Bold) 0$($c.Reset)  ❌ Exit (Stop All & Quit)"
    Write-Host ""
}

function Select-Service {
    param([string]$Action)
    Write-Host ""
    Write-Host "    $($c.Cyan)Select service to ${Action}:$($c.Reset)"
    Write-Host ""
    Write-Host "    $($c.Bold)1$($c.Reset) PostgreSQL   $($c.Bold)2$($c.Reset) Redis   $($c.Bold)3$($c.Reset) Backend   $($c.Bold)4$($c.Reset) Frontend"
    Write-Host ""
    $choice = Read-Host "    Selection"
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

function Start-IndividualService([string]$Name) {
    switch ($Name) {
        "PostgreSQL" { Start-PostgreSQL }
        "Redis"      { Start-Redis }
        "Backend"    { Start-BackendWindow }
        "Frontend"   { Start-FrontendWindow }
    }
}

function Stop-IndividualService([string]$Name) {
    switch ($Name) {
        "PostgreSQL" { Stop-PostgreSQL }
        "Redis"      { Stop-Redis }
        "Backend"    { Stop-BackendWindow }
        "Frontend"   { Stop-FrontendWindow }
    }
}

# ╔═══════════════════════════════════════════════════════════════╗
# ║  MAIN ENTRY POINT                                            ║
# ╚═══════════════════════════════════════════════════════════════╝
function Main {
    # Ensure directories exist
    @($script:Config.LogDir, $script:Config.PidDir) | ForEach-Object {
        if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
    }

    $script:LogFile = Join-Path $script:Config.LogDir "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

    # Authenticate
    if (-not $SkipAuth) {
        if (-not (Invoke-Authentication)) {
            exit 1
        }
    }

    Write-Log "Session started" "SUCCESS"
    Write-Log "Log: $($script:LogFile)" "DEBUG"

    # Cleanup stale PID files
    Get-ChildItem -Path $script:Config.PidDir -Filter "*.pid" -ErrorAction SilentlyContinue | ForEach-Object {
        $savedPid = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($savedPid -match '^\d+$') {
            $proc = Get-Process -Id ([int]$savedPid) -ErrorAction SilentlyContinue
            if (-not $proc -or $proc.HasExited) {
                Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
            }
        }
    }

    $running = $true
    while ($running) {
        Show-Dashboard
        $choice = Read-Host "  $($c.Bold)▸$($c.Reset) Select option"

        switch ($choice) {
            "1" {
                Start-AllServices
                Read-Host "`n  Press Enter to continue"
            }
            "2" {
                Stop-AllServices
                Read-Host "`n  Press Enter to continue"
            }
            "3" {
                Stop-AllServices
                Start-Sleep -Seconds 2
                Start-AllServices
                Read-Host "`n  Press Enter to continue"
            }
            "4" {
                $svc = Select-Service "start"
                if ($svc) { Start-IndividualService $svc }
                Read-Host "`n  Press Enter to continue"
            }
            "5" {
                $svc = Select-Service "stop"
                if ($svc) { Stop-IndividualService $svc }
                Read-Host "`n  Press Enter to continue"
            }
            "6" {
                Invoke-BuildBackend
                Read-Host "`n  Press Enter to continue"
            }
            "7" {
                Invoke-RunTests
                Read-Host "`n  Press Enter to continue"
            }
            "8" {
                Test-ApiHealth
                Read-Host "`n  Press Enter to continue"
            }
            "9" {
                Test-DatabaseConnection
                Read-Host "`n  Press Enter to continue"
            }
            "10" {
                Test-RedisConnection
                Read-Host "`n  Press Enter to continue"
            }
            "11" {
                Show-LiveLogs "Backend"
                Read-Host "`n  Press Enter to continue"
            }
            "12" {
                Show-LiveLogs "Frontend"
                Read-Host "`n  Press Enter to continue"
            }
            "13" {
                Invoke-BuildFrontend
                Read-Host "`n  Press Enter to continue"
            }
            "14" {
                Invoke-DatabaseMigration
                Read-Host "`n  Press Enter to continue"
            }
            "15" {
                Open-InBrowser "$($script:Config.ApiUrl)/swagger"
            }
            "16" {
                Open-InBrowser $script:Config.FrontendUrl
            }
            "17" {
                Open-DatabaseConsole
                Read-Host "`n  Press Enter to continue"
            }
            "18" {
                Start-Process "explorer.exe" -ArgumentList $script:Config.LogDir
                Write-Log "Opened log folder" "SUCCESS"
            }
            "0" {
                Write-Host ""
                Write-Log "Shutting down..." "STEP"
                Stop-AllServices
                Write-Host ""
                Write-Box -Lines @(
                    "",
                    "  $($c.Bold)Session ended.$($c.Reset)",
                    "  $($c.Dim)Log saved to: $($script:LogFile)$($c.Reset)",
                    "",
                    "  $($c.Pink)Thank you for using PATRY♡CLOSET 👋$($c.Reset)",
                    ""
                ) -Color $c.Magenta -Title "Goodbye"
                Write-Host ""
                $running = $false
            }
            default {
                Write-Host "  $($c.Yellow)Invalid option — please select 0-18$($c.Reset)"
                Start-Sleep -Seconds 1
            }
        }
    }

    # Cleanup launcher scripts
    Get-ChildItem -Path $script:Config.LogDir -Filter "*-launcher.ps1" -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue
}

# Run
Main
