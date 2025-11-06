# Branch Switching Tools

## Files Created:

### 1. Git Hook (Auto) ✓

- `.git/hooks/post-checkout` - Bash wrapper
- `.git/hooks/post-checkout.ps1` - PowerShell hook
- **Auto-runs after every `git checkout`**

### 2. Smart Script

- `switch-branch.ps1` - Full featured with stash support

```powershell
.\switch-branch.ps1 develop
```

### 3. Quick Script

- `quick-switch.ps1` - Fast, always reinstalls

```powershell
.\quick-switch.ps1 feature/new-branch
```

## Usage:

### Method 1: Normal Git (with auto hook)

```bash
git checkout branch-name
# Hook auto-detects package.json changes
# Runs npm install if needed
```

### Method 2: Smart Switch

```powershell
.\switch-branch.ps1 branch-name
# Handles uncommitted changes
# Smart detection of package.json changes
# Clean reinstall
```

### Method 3: Quick Switch

```powershell
.\quick-switch.ps1 branch-name
# Always reinstalls (safe but slower)
```

## Manual Reinstall (if needed):

```powershell
cd Source\frontend
rm -rf node_modules
npm ci
```

## All scripts use ASCII only - no emoji encoding issues!
