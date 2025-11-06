# Quick Branch Switch - Minimal version
# Usage: .\quick-switch.ps1 <branch-name>

param([Parameter(Mandatory=$true)][string]$Branch)

Write-Host "[SWITCH] Changing to: $Branch" -ForegroundColor Cyan
git checkout $Branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Switched to $Branch" -ForegroundColor Green
    
    # Always reinstall to be safe
    if (Test-Path "Source\frontend\package.json") {
        Write-Host "[NPM] Reinstalling dependencies..." -ForegroundColor Yellow
        Push-Location "Source\frontend"
        npm install --silent
        Pop-Location
        Write-Host "[OK] Done!" -ForegroundColor Green
    }
} else {
    Write-Host "[ERROR] Failed to switch branch" -ForegroundColor Red
}
