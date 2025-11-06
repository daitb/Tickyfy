# Setup Development Environment - Tickify Project

## 🚀 Quick Start cho New Developer

### Prerequisites

- [ ] Visual Studio Code hoặc Visual Studio 2022
- [ ] .NET 9.0 SDK
- [ ] Node.js 18+
- [ ] Git
- [ ] Access vào Azure Portal (nhận từ Team Lead)

---

## 📝 Bước 1: Clone Repository

```bash
git clone https://github.com/your-org/tickify-event-management.git
cd tickify-event-management
```

---

## 🔑 Bước 2: Nhận Database Credentials

**Liên hệ Team Lead để nhận**:

- SQL Login username: `devX_backend` hoặc `devX_frontend`
- SQL Password: `[Nhận qua Slack/Email]`
- Azure Storage Connection String

---

## 🗄️ Bước 3: Setup Database Connection

### Option A: User Secrets (Recommended)

```bash
cd Source/backend/Tickify/Tickify

# Initialize user secrets (chỉ chạy 1 lần)
dotnet user-secrets init

# Set your credentials (thay YOUR_USERNAME và YOUR_PASSWORD)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=tcp:tickify.database.windows.net,1433;Initial Catalog=TickifyDB;User ID=YOUR_USERNAME;Password=YOUR_PASSWORD;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=True"

# Set Azure Storage
dotnet user-secrets set "Azure:StorageAccount:ConnectionString" "YOUR_STORAGE_CONNECTION_STRING"
```

### Option B: appsettings.Development.json (Gitignored)

```bash
cd Source/backend/Tickify/Tickify

# Copy example file
cp appsettings.example.json appsettings.Development.json

# Edit appsettings.Development.json và thay YOUR_USERNAME, YOUR_PASSWORD
```

---

## 🌐 Bước 4: Add Your IP to SQL Firewall

### Via Azure Portal

1. Login: https://portal.azure.com
2. Navigate to: **SQL Server** → `tickify`
3. **Networking** → **Firewall rules**
4. Click **+ Add client IPv4 address**
5. Click **Save**

### Via PowerShell (nếu có Azure CLI)

```powershell
az sql server firewall-rule create `
  --resource-group tickify-rg `
  --server tickify `
  --name "YourName-Home" `
  --start-ip-address $(Invoke-RestMethod -Uri 'https://api.ipify.org?format=text') `
  --end-ip-address $(Invoke-RestMethod -Uri 'https://api.ipify.org?format=text')
```

---

## 🧪 Bước 5: Test Database Connection

```bash
cd Source/backend/Tickify/Tickify
dotnet restore
dotnet build
dotnet run
```

**Expected Output**:

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5128
```

**Test API**: http://localhost:5128/swagger

---

## 🎨 Bước 6: Setup Frontend

```bash
cd Source/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Open**: http://localhost:3000

---

## ✅ Verify Installation

### Backend Checklist

- [ ] `dotnet run` không có errors
- [ ] Swagger UI accessible: http://localhost:5128/swagger
- [ ] Test API endpoint: `GET /api/categories`

### Frontend Checklist

- [ ] `npm run dev` không có errors
- [ ] Homepage loads: http://localhost:3000
- [ ] Console không có errors

### Database Checklist

- [ ] Có thể query database qua SSMS/Azure Data Studio
- [ ] Test query: `SELECT COUNT(*) FROM Users;`

---

## 📚 Useful Commands

### Backend

```bash
# Build
dotnet build

# Run
dotnet run

# Run with watch (auto-reload)
dotnet watch run

# Run tests
dotnet test

# Restore packages
dotnet restore
```

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "feat: add event listing page"

# Push to remote
git push origin feature/your-feature-name

# Pull latest changes
git pull origin develop
```

---

## 🔒 Security Best Practices

### DO ✅

- Use user secrets or environment variables for credentials
- Keep `appsettings.Development.json` in `.gitignore`
- Rotate your SQL password every 3 months
- Use strong passwords (min 12 characters)

### DON'T ❌

- Commit credentials to Git
- Share your password via email/chat
- Use weak passwords
- Commit `appsettings.Development.json`

---

## 🆘 Troubleshooting

### "Cannot connect to SQL Server"

1. Check firewall rule: Azure Portal → SQL Server → Networking
2. Verify credentials in user secrets: `dotnet user-secrets list`
3. Test connection string: Copy to SSMS and try connecting

### "Login failed for user"

1. Verify username/password với Team Lead
2. Check SQL user exists:
   ```sql
   SELECT name FROM sys.database_principals WHERE type = 'S';
   ```

### "npm install fails"

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Try `npm install --legacy-peer-deps`

### "Port already in use"

- Backend (5128): Kill process on port 5128
- Frontend (3000): Kill process on port 3000

```powershell
# Find process
netstat -ano | findstr :5128

# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

## 📞 Support

**Team Lead**: [Name] - [email@example.com]  
**Backend Lead**: [Name] - [email@example.com]  
**Frontend Lead**: [Name] - [email@example.com]

**Slack Channel**: #tickify-dev  
**Documentation**: [Confluence/Notion Link]

---

## 🎯 Next Steps

1. Read `AZURE-STORAGE-IMPLEMENTATION-PLAN.md`
2. Review `Database_Schema.sql`
3. Check Jira for assigned tasks
4. Join daily standup meeting

---

**Last Updated**: November 6, 2025  
**Maintained by**: Team Lead
