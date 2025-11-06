# 🔄 Git Branch Switching - Best Practices

## ⚠️ Vấn đề:

Khi đổi branch, `node_modules/` có thể không khớp với `package.json` mới → lỗi import

---

## ✅ GIẢI PHÁP 1: Git Hook (Tự động) - ĐÃ CÀI ĐẶT

Git hook `.git/hooks/post-checkout.ps1` đã được cài đặt sẽ:

- Tự động detect khi `package.json` thay đổi
- Chạy `npm install` sau mỗi lần checkout branch

### Cách dùng:

```bash
git checkout branch-name
# Hook tự động chạy npm install nếu cần
```

---

## ✅ GIẢI PHÁP 2: Manual (Sau mỗi lần đổi branch)

### Windows PowerShell:

```powershell
# Đổi branch và cài lại dependencies
git checkout branch-name
cd Source/frontend
npm install
```

### Hoặc tạo alias:

```powershell
# Thêm vào PowerShell profile: $PROFILE
function Switch-Branch {
    param($branchName)
    git checkout $branchName
    if ($LASTEXITCODE -eq 0) {
        Push-Location "Source\frontend"
        npm install
        Pop-Location
    }
}
Set-Alias -Name gsw -Value Switch-Branch

# Dùng: gsw feature/new-branch
```

---

## ✅ GIẢI PHÁP 3: Clean Install (Khi gặp lỗi nghiêm trọng)

```bash
cd Source/frontend

# Xóa node_modules và cache
rm -rf node_modules
rm -rf .vite
rm package-lock.json  # Optional

# Cài lại từ đầu
npm install

# Hoặc dùng npm ci (nhanh hơn, dựa trên package-lock.json)
npm ci
```

---

## ✅ GIẢI PHÁP 4: Git Worktree (Mỗi branch riêng thư mục)

```bash
# Tạo worktree cho branch khác
git worktree add ../tickify-feature-branch feature/new-branch

# Mỗi branch có node_modules riêng
# Không cần reinstall khi switch
```

**Cấu trúc:**

```
tickify-event-management/          (develop branch)
├── Source/frontend/node_modules/  (develop dependencies)

tickify-feature-branch/             (feature branch - riêng biệt)
├── Source/frontend/node_modules/  (feature dependencies)
```

---

## ✅ GIẢI PHÁP 5: Package Manager Cache

### Dùng pnpm thay vì npm (nhanh hơn nhiều):

```bash
# Cài pnpm
npm install -g pnpm

# Dùng pnpm
cd Source/frontend
pnpm install  # Dùng cache, cực nhanh
```

### Hoặc dùng npm với cache:

```bash
npm install --prefer-offline  # Dùng cache nếu có
```

---

## 📋 BEST PRACTICES

### Trước khi đổi branch:

```bash
# 1. Commit hoặc stash changes
git status
git add .
git commit -m "Your message"
# hoặc
git stash

# 2. Checkout branch
git checkout target-branch

# 3. Check package.json changes
git diff develop -- Source/frontend/package.json

# 4. Nếu có thay đổi → reinstall
cd Source/frontend
npm install
```

### Sau khi đổi branch:

```bash
# Luôn check dependencies
cd Source/frontend
npm list --depth=0  # Xem packages installed

# Nếu có warning
npm install
```

---

## 🎯 KHUYẾN NGHỊ:

1. ✅ **Dùng Git Hook** (đã setup) - Tự động nhất
2. ✅ **Luôn commit `package-lock.json`** - Đảm bảo version consistency
3. ✅ **Dùng `npm ci`** thay vì `npm install` khi clone/pull
4. ✅ **Định kỳ clean node_modules** (1 tuần/lần)

---

## 🚨 TROUBLESHOOTING

### Lỗi: Module not found sau khi switch branch

```bash
cd Source/frontend
rm -rf node_modules
npm install
```

### Lỗi: PowerShell execution policy

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Lỗi: Git hook không chạy

```bash
# Check hook file
cat .git/hooks/post-checkout.ps1

# Reconfig
git config --local core.hooksPath .git/hooks
```

---

## 📝 TÓM TẮT WORKFLOW:

```bash
# Cách 1: Tự động (đã setup)
git checkout feature/new-branch
# → Hook tự động npm install nếu package.json thay đổi

# Cách 2: Manual
git checkout feature/new-branch
cd Source/frontend && npm install

# Cách 3: Safe (khi nghi ngờ có lỗi)
git checkout feature/new-branch
cd Source/frontend
rm -rf node_modules
npm ci
```

**Hook đã được cài đặt ✅ - Từ giờ switch branch sẽ tự động!**
