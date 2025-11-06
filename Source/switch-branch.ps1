# Smart Branch Switcher with Auto npm install
# Usage: .\switch-branch.ps1 <branch-name>

param(
    [Parameter(Mandatory=$true)]
    [string]$BranchName
)

Write-Host "[SWITCH] Switching to branch: $BranchName" -ForegroundColor Cyan

# 1. Check current status
$status = git status --porcelain
if ($status) {
    Write-Host "[WARNING] You have uncommitted changes:" -ForegroundColor Yellow
    git status --short
    
    $response = Read-Host "Do you want to stash them? (y/n)"
    if ($response -eq 'y') {
        git stash push -m "Auto stash before switching to $BranchName"
        Write-Host "[OK] Changes stashed" -ForegroundColor Green
    } else {
        Write-Host "[CANCEL] Operation cancelled" -ForegroundColor Red
        exit 1
    }
}

# 2. Get current package.json hash
$currentPackageJson = ""
if (Test-Path "Source\frontend\package.json") {
    $currentPackageJson = Get-FileHash "Source\frontend\package.json" -Algorithm MD5 | Select-Object -ExpandProperty Hash
}

# 3. Checkout branch
Write-Host "[GIT] Checking out $BranchName..." -ForegroundColor Cyan
git checkout $BranchName

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to checkout branch" -ForegroundColor Red
    exit 1
}

# 4. Check if package.json changed
$newPackageJson = ""
if (Test-Path "Source\frontend\package.json") {
    $newPackageJson = Get-FileHash "Source\frontend\package.json" -Algorithm MD5 | Select-Object -ExpandProperty Hash
}

if ($currentPackageJson -ne $newPackageJson) {
    Write-Host "[NPM] package.json changed, reinstalling dependencies..." -ForegroundColor Yellow
    Push-Location "Source\frontend"
    
    # Check if node_modules exists
    if (Test-Path "node_modules") {
        Write-Host "[CLEAN] Removing old node_modules..." -ForegroundColor Gray
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    }
    
    Write-Host "[NPM] Installing dependencies..." -ForegroundColor Cyan
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
} else {
    Write-Host "[OK] No package.json changes - dependencies OK" -ForegroundColor Green
}

# 5. Show final status
Write-Host "`n[INFO] Branch info:" -ForegroundColor Cyan
git branch --show-current
git log -1 --oneline

Write-Host "`n[SUCCESS] Successfully switched to $BranchName!" -ForegroundColor Green
