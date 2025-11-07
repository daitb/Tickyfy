# Smart Git Hook Installer
# Run this ONCE to setup automatic npm install detection when switching branches
# Usage: .\setup-auto-switch.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Git Hook Auto-Switch Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$hookPath = ".git\hooks\post-checkout"
$scriptRoot = $PSScriptRoot

# Create the PowerShell hook script content
$hookContent = @'
#!/usr/bin/env pwsh
# Git post-checkout hook - Auto npm install when package.json changes
# This hook runs automatically after every 'git checkout'

param($prevHead, $newHead, $isBranchCheckout)

# Only run on branch checkout (not file checkout)
if ($isBranchCheckout -ne "1") {
    exit 0
}

# Get current branch name
$currentBranch = git branch --show-current

# Skip main and develop branches
if ($currentBranch -eq "main" -or $currentBranch -eq "develop") {
    Write-Host "[GIT-HOOK] Skipping auto-install on '$currentBranch' branch" -ForegroundColor Gray
    exit 0
}

Write-Host "`n[GIT-HOOK] Checking for dependency changes..." -ForegroundColor Cyan

$packageJsonPath = "Source\frontend\package.json"

if (Test-Path $packageJsonPath) {
    # Check if package.json changed between commits
    $diff = git diff --name-only $prevHead $newHead
    
    if ($diff -match "Source[\\/]frontend[\\/]package\.json") {
        Write-Host "[NPM] package.json changed! Reinstalling dependencies..." -ForegroundColor Yellow
        
        Push-Location "Source\frontend"
        
        # Remove old node_modules to avoid conflicts
        if (Test-Path "node_modules") {
            Write-Host "[CLEAN] Removing old node_modules..." -ForegroundColor Gray
            Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
        }
        
        # Remove package-lock.json to ensure clean install
        if (Test-Path "package-lock.json") {
            Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "[NPM] Running: npm install..." -ForegroundColor Cyan
        npm install --loglevel=error
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Dependencies installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
        }
        
        Pop-Location
    } else {
        Write-Host "[OK] package.json unchanged - no reinstall needed" -ForegroundColor Green
    }
} else {
    Write-Host "[INFO] No frontend package.json found" -ForegroundColor Gray
}

Write-Host "[GIT-HOOK] Done!`n" -ForegroundColor Cyan
exit 0
'@

# Auto-detect project root
$currentPath = Get-Location
$projectRoot = $currentPath

# Search for .git folder upwards
while ($projectRoot -and !(Test-Path "$projectRoot\.git")) {
    $projectRoot = Split-Path $projectRoot -Parent
}

if (-not $projectRoot) {
    Write-Host "[ERROR] Not in a git repository! Please run from project directory." -ForegroundColor Red
    exit 1
}

# Change to project root
if ($currentPath -ne $projectRoot) {
    Write-Host "[INFO] Detected project root: $projectRoot" -ForegroundColor Gray
    Set-Location $projectRoot
}

# Create hooks directory if not exists
if (-not (Test-Path ".git\hooks")) {
    New-Item -ItemType Directory -Path ".git\hooks" -Force | Out-Null
}

# Write the hook file
Write-Host "[SETUP] Creating post-checkout hook..." -ForegroundColor Cyan
Set-Content -Path $hookPath -Value $hookContent -Encoding UTF8

# Make it executable (Git requires this)
Write-Host "[SETUP] Setting permissions..." -ForegroundColor Cyan

# On Windows, we need to ensure Git can execute PowerShell scripts
# Git on Windows will automatically use bash/sh, so we create a wrapper
$bashWrapperContent = @"
#!/bin/sh
# Wrapper to call PowerShell hook
pwsh.exe -ExecutionPolicy Bypass -File `"`$(dirname `$0)/post-checkout`" `$1 `$2 `$3
"@

$bashWrapperPath = ".git\hooks\post-checkout.sh"
Set-Content -Path $bashWrapperPath -Value $bashWrapperContent -Encoding UTF8

# Rename PowerShell script to .ps1
$psHookPath = ".git\hooks\post-checkout.ps1"
Move-Item -Path $hookPath -Destination $psHookPath -Force

# Create the main hook that calls PowerShell
$mainHookContent = @"
#!/bin/sh
# Git post-checkout hook - calls PowerShell script
pwsh.exe -ExecutionPolicy Bypass -File "`$(dirname `$0)/post-checkout.ps1" `$1 `$2 `$3
"@

Set-Content -Path $hookPath -Value $mainHookContent -Encoding UTF8

Write-Host "[OK] Git hook installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What happens now:" -ForegroundColor Yellow
Write-Host "  1. When you run: git checkout <branch>" -ForegroundColor White
Write-Host "  2. Git will automatically check if package.json changed" -ForegroundColor White
Write-Host "  3. If changed: npm install runs automatically" -ForegroundColor White
Write-Host "  4. If unchanged: nothing happens (saves time!)" -ForegroundColor White
Write-Host ""
Write-Host "Try it now:" -ForegroundColor Yellow
Write-Host "  git checkout main" -ForegroundColor White
Write-Host "  git checkout develop" -ForegroundColor White
Write-Host ""
Write-Host "No more manual npm install needed! 🎉" -ForegroundColor Green
