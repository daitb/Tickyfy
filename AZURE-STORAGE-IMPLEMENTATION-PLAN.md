# Azure Storage Implementation Plan - Tickify Project

## 📦 Tổng Quan Azure Storage

**Azure Storage** là dịch vụ lưu trữ đám mây của Microsoft Azure, cung cấp giải pháp lưu trữ có tính khả dụng cao, bảo mật, bền vững và có khả năng mở rộng.

---

## 👥 Quản Lý Quyền Truy Cập Cho Team Members

### **1. Azure SQL Database - Phân Quyền Database**

#### **A. Thêm Team Member vào Azure Portal**

**Bước 1: Thêm thành viên vào Subscription/Resource Group**

```bash
# Via Azure CLI
az role assignment create \
  --assignee user@example.com \
  --role "Contributor" \
  --scope /subscriptions/{subscription-id}/resourceGroups/tickify-rg
```

**Hoặc qua Azure Portal**:

1. Vào **Azure Portal** → **Resource Groups** → `tickify-rg`
2. Click **Access control (IAM)** → **+ Add** → **Add role assignment**
3. Chọn role:
   - **Owner**: Full control (cho Team Lead)
   - **Contributor**: Quản lý resources nhưng không assign roles (cho Developers)
   - **Reader**: Chỉ xem (cho QA/Testers)
4. Select members → Nhập email → Review + assign

#### **B. Tạo SQL Users cho Team Members**

**Option 1: SQL Authentication (Username/Password)**

```sql
-- Connect as admin to master database
USE master;
GO

-- Create login for team member
CREATE LOGIN dev1_login WITH PASSWORD = 'SecurePassword123!';
CREATE LOGIN dev2_login WITH PASSWORD = 'SecurePassword123!';
CREATE LOGIN dev3_login WITH PASSWORD = 'SecurePassword123!';
GO

-- Switch to TickifyDB
USE TickifyDB;
GO

-- Create database users
CREATE USER dev1_user FOR LOGIN dev1_login;
CREATE USER dev2_user FOR LOGIN dev2_login;
CREATE USER dev3_user FOR LOGIN dev3_login;
GO

-- Grant permissions
-- Full access for developers
ALTER ROLE db_owner ADD MEMBER dev1_user;
ALTER ROLE db_owner ADD MEMBER dev2_user;

-- Read/Write access for dev3
ALTER ROLE db_datareader ADD MEMBER dev3_user;
ALTER ROLE db_datawriter ADD MEMBER dev3_user;
GO
```

**Option 2: Azure AD Authentication (Recommended for Production)**

```sql
-- Connect as admin to TickifyDB
USE TickifyDB;
GO

-- Create Azure AD user (using their Microsoft account)
CREATE USER [dev1@company.com] FROM EXTERNAL PROVIDER;
CREATE USER [dev2@company.com] FROM EXTERNAL PROVIDER;
CREATE USER [QA-Team] FROM EXTERNAL PROVIDER; -- AD Group
GO

-- Assign roles
ALTER ROLE db_owner ADD MEMBER [dev1@company.com];
ALTER ROLE db_datareader ADD MEMBER [dev2@company.com];
ALTER ROLE db_datareader ADD MEMBER [QA-Team];
GO
```

#### **C. Connection String cho Team Members**

**Dev 1 (Full Access)**:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:tickify.database.windows.net,1433;Initial Catalog=TickifyDB;User ID=dev1_login;Password=SecurePassword123!;Encrypt=True;TrustServerCertificate=True;"
  }
}
```

**Dev 2 (Azure AD Auth)**:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:tickify.database.windows.net,1433;Initial Catalog=TickifyDB;Authentication=Active Directory Interactive;Encrypt=True;"
  }
}
```

#### **D. Firewall Rules - Cho phép IP của Team**

**Via Azure Portal**:

1. Vào **SQL Server** → **Networking**
2. **Firewall rules** → **+ Add client IPv4 address**
3. Hoặc add range:
   - Rule name: `Office-Network`
   - Start IP: `203.162.0.1`
   - End IP: `203.162.0.255`

**Via Azure CLI**:

```bash
az sql server firewall-rule create \
  --resource-group tickify-rg \
  --server tickify \
  --name Dev1-Home \
  --start-ip-address 123.45.67.89 \
  --end-ip-address 123.45.67.89
```

---

### **2. Azure Storage Account - Phân Quyền Storage**

#### **A. Thêm Team Member vào Storage Account**

**Via Azure Portal**:

1. Vào **Storage Account** → `tickifystorage`
2. **Access Control (IAM)** → **+ Add role assignment**
3. Chọn role phù hợp:

| Role                               | Quyền                                      | Dành cho                |
| ---------------------------------- | ------------------------------------------ | ----------------------- |
| **Storage Blob Data Owner**        | Full access (read/write/delete/manage ACL) | Team Lead, DevOps       |
| **Storage Blob Data Contributor**  | Read/write/delete blobs                    | Backend Developers      |
| **Storage Blob Data Reader**       | Chỉ đọc blobs                              | Frontend Developers, QA |
| **Storage Queue Data Contributor** | Read/write/delete messages                 | Backend Developers      |
| **Storage Table Data Contributor** | Read/write table data                      | Analytics Team          |

**Via Azure CLI**:

```bash
# Grant Blob Contributor to developer
az role assignment create \
  --assignee dev1@company.com \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/{subscription-id}/resourceGroups/tickify-rg/providers/Microsoft.Storage/storageAccounts/tickifystorage
```

#### **B. Shared Access Signature (SAS) Tokens**

**Tạo SAS Token có thời hạn cho Team Members**:

**Via Azure Portal**:

1. Storage Account → **Shared access signature**
2. Configure:
   - **Allowed services**: Blob, Queue, Table
   - **Allowed resource types**: Container, Object
   - **Allowed permissions**: Read, Write, List (không cho Delete)
   - **Start/Expiry time**: 2025-11-06 → 2025-12-06 (30 days)
3. Click **Generate SAS and connection string**
4. Copy **Connection string** hoặc **SAS token**

**Via Azure CLI**:

```bash
# Generate SAS token with 30 days expiry
az storage account generate-sas \
  --account-name tickifystorage \
  --services b \
  --resource-types co \
  --permissions rwl \
  --expiry 2025-12-06T23:59:59Z \
  --https-only
```

**Connection String với SAS Token**:

```json
{
  "Azure": {
    "StorageAccount": {
      "ConnectionString": "BlobEndpoint=https://tickifystorage.blob.core.windows.net/;SharedAccessSignature=sv=2021-06-08&ss=b&srt=co&sp=rwl&se=2025-12-06T23:59:59Z&sig=..."
    }
  }
}
```

#### **C. Access Keys (Cẩn thận khi share)**

**⚠️ Warning**: Access Keys có full quyền, chỉ share cho Team Lead/DevOps

**Rotate Keys định kỳ**:

```bash
# Regenerate key1 (sau khi đã update key2 ở mọi nơi)
az storage account keys renew \
  --account-name tickifystorage \
  --resource-group tickify-rg \
  --key key1
```

**Best Practice**:

- Key1 cho Production
- Key2 cho Development
- Rotate key2 mỗi tháng

---

### **3. Role-Based Access Control (RBAC) - Best Practices**

#### **Team Structure Recommended**

```
tickify-subscription
│
├── tickify-prod-rg (Production)
│   ├── Owner: Team Lead
│   ├── Contributor: DevOps Team
│   └── Reader: QA Team, Developers
│
├── tickify-dev-rg (Development)
│   ├── Owner: Team Lead, Senior Devs
│   ├── Contributor: All Developers
│   └── Reader: QA Team
│
└── tickify-test-rg (Testing/Staging)
    ├── Contributor: Developers, QA
    └── Reader: Stakeholders
```

#### **SQL Database Roles Mapping**

| Team Member              | SQL Role                          | Permissions                                |
| ------------------------ | --------------------------------- | ------------------------------------------ |
| **Dev 1 (Backend Lead)** | `db_owner`                        | Full control: CREATE, ALTER, DROP tables   |
| **Dev 2 (Backend Dev)**  | `db_owner`                        | Full control during development            |
| **Dev 3 (Frontend Dev)** | `db_datareader` + `db_datawriter` | Read/Write data only, no schema changes    |
| **QA Team**              | `db_datareader`                   | Read-only access for testing               |
| **CI/CD Pipeline**       | Custom role                       | Execute stored procedures, read/write data |

**Custom Role cho CI/CD**:

```sql
-- Create custom role
CREATE ROLE ci_cd_role;
GO

-- Grant specific permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO ci_cd_role;
GRANT EXECUTE ON SCHEMA::dbo TO ci_cd_role;
GO

-- Add user
CREATE USER [cicd-service-principal] FROM EXTERNAL PROVIDER;
ALTER ROLE ci_cd_role ADD MEMBER [cicd-service-principal];
GO
```

#### **Storage Account Permissions Mapping**

| Team Member       | Storage Role                    | Use Case                              |
| ----------------- | ------------------------------- | ------------------------------------- |
| **Backend Devs**  | `Storage Blob Data Contributor` | Upload/delete images via API          |
| **Frontend Devs** | `Storage Blob Data Reader`      | View images, test UI                  |
| **QA Team**       | `Storage Blob Data Reader`      | Verify uploaded content               |
| **DevOps**        | `Storage Blob Data Owner`       | Manage containers, lifecycle policies |
| **CI/CD**         | `Storage Blob Data Contributor` | Deploy assets, run tests              |

---

### **4. Chia Sẻ Credentials An Toàn**

#### **Option 1: Azure Key Vault (Recommended)**

**Setup Key Vault**:

```bash
# Create Key Vault
az keyvault create \
  --name tickify-keyvault \
  --resource-group tickify-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name tickify-keyvault \
  --name "SqlConnectionString" \
  --value "Server=tcp:tickify.database.windows.net,1433;..."

az keyvault secret set \
  --vault-name tickify-keyvault \
  --name "StorageConnectionString" \
  --value "DefaultEndpointsProtocol=https;AccountName=..."
```

**Grant access to team members**:

```bash
az keyvault set-policy \
  --name tickify-keyvault \
  --upn dev1@company.com \
  --secret-permissions get list
```

**Use in appsettings.json**:

```json
{
  "KeyVault": {
    "VaultUri": "https://tickify-keyvault.vault.azure.net/"
  }
}
```

```csharp
// Program.cs
var keyVaultUri = builder.Configuration["KeyVault:VaultUri"];
builder.Configuration.AddAzureKeyVault(
    new Uri(keyVaultUri),
    new DefaultAzureCredential()
);

// Now can access secrets like normal config
var connectionString = builder.Configuration["SqlConnectionString"];
```

#### **Option 2: Environment Variables (Development)**

**Tạo file `.env.local` (gitignored)**:

```bash
# .env.local - Dev 1
SQL_CONNECTION_STRING="Server=tcp:tickify.database.windows.net,1433;User ID=dev1_login;Password=..."
STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=tickifystorage;AccountKey=..."
```

**Load trong `launchSettings.json`**:

```json
{
  "profiles": {
    "Tickify": {
      "environmentVariables": {
        "ConnectionStrings__DefaultConnection": "$(SQL_CONNECTION_STRING)",
        "Azure__StorageAccount__ConnectionString": "$(STORAGE_CONNECTION_STRING)"
      }
    }
  }
}
```

#### **Option 3: 1Password/LastPass (Team Password Manager)**

1. Tạo Vault: `Tickify Project`
2. Store items:
   - Azure SQL - Dev1 Login
   - Azure SQL - Dev2 Login
   - Azure Storage - SAS Token (30 days)
   - Azure Portal - Admin Account
3. Share với team members qua email invitation

---

### **5. Monitoring & Auditing**

#### **Track Database Access**

**Enable Auditing**:

```sql
-- Azure Portal: SQL Server → Auditing → Turn ON
-- Log to: Storage account or Log Analytics Workspace
```

**Query audit logs**:

```sql
-- View login attempts
SELECT
    event_time,
    server_principal_name,
    database_name,
    client_ip,
    succeeded
FROM sys.fn_get_audit_file('https://tickifystorage.blob.core.windows.net/sqlaudit/*.xel', default, default)
WHERE action_id = 'LGIS' -- Login
ORDER BY event_time DESC;
```

#### **Monitor Storage Access**

**Enable Storage Analytics**:

```bash
az storage logging update \
  --account-name tickifystorage \
  --log rwd \
  --retention 7 \
  --services b
```

**View access logs**:

```csharp
var blobServiceClient = new BlobServiceClient(connectionString);
var logsContainer = blobServiceClient.GetBlobContainerClient("$logs");

await foreach (var blob in logsContainer.GetBlobsAsync())
{
    Console.WriteLine($"Log: {blob.Name}");
    // Parse log entries: timestamp, operation, status, user
}
```

---

### **6. Quick Setup Script cho New Team Member**

```bash
#!/bin/bash
# add-team-member.sh

MEMBER_EMAIL=$1
MEMBER_NAME=$2
SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP="tickify-rg"
SQL_SERVER="tickify"
STORAGE_ACCOUNT="tickifystorage"

echo "Adding $MEMBER_NAME ($MEMBER_EMAIL) to Tickify project..."

# 1. Add to Resource Group
az role assignment create \
  --assignee $MEMBER_EMAIL \
  --role "Contributor" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP

# 2. Add to Storage Account
az role assignment create \
  --assignee $MEMBER_EMAIL \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Storage/storageAccounts/$STORAGE_ACCOUNT

# 3. Add SQL firewall rule (get their public IP)
MEMBER_IP=$(curl -s ifconfig.me)
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER \
  --name "$MEMBER_NAME-Access" \
  --start-ip-address $MEMBER_IP \
  --end-ip-address $MEMBER_IP

# 4. Create SQL login (manual SQL script)
echo "Run this SQL script to create database user:"
echo "CREATE LOGIN ${MEMBER_NAME}_login WITH PASSWORD = 'TempPassword123!';"
echo "USE TickifyDB; CREATE USER ${MEMBER_NAME}_user FOR LOGIN ${MEMBER_NAME}_login;"
echo "ALTER ROLE db_owner ADD MEMBER ${MEMBER_NAME}_user;"

echo "✅ Done! Send credentials via secure channel."
```

**Usage**:

```bash
chmod +x add-team-member.sh
./add-team-member.sh "dev3@fpt.edu.vn" "Dev3"
```

---

### **7. Checklist Onboarding New Developer**

- [ ] Add to Azure AD (if using Azure AD auth)
- [ ] Assign Resource Group role (Contributor)
- [ ] Assign Storage role (Blob Data Contributor)
- [ ] Add IP to SQL firewall
- [ ] Create SQL login/user
- [ ] Grant appropriate database role
- [ ] Share connection strings via Key Vault or secure channel
- [ ] Add to GitHub repository
- [ ] Add to project documentation (Confluence/Notion)
- [ ] Setup local development environment
- [ ] Test database connection
- [ ] Test storage upload/download

---

## 🎯 4 Loại Azure Storage Chính

### 1. **Blob Storage** (Binary Large Object) - Phổ biến nhất

- **Mục đích**: Lưu trữ dữ liệu phi cấu trúc (unstructured data)
- **Sử dụng cho**:
  - 🖼️ Hình ảnh, video
  - 📄 Tài liệu, PDF
  - 💾 Backup files
  - 📊 Logs, telemetry data
  - 🎬 Media streaming

**3 loại Blob**:

- **Block Blobs**: Files thông thường (images, documents) - tối đa 190.7 TB
- **Append Blobs**: Log files (chỉ thêm data vào cuối)
- **Page Blobs**: Virtual hard disks (VHDs) cho VMs

### 2. **File Storage** (Azure Files)

- **Mục đích**: File shares trong cloud (giống network drive)
- **Sử dụng cho**:
  - 📁 Shared folders cho nhiều VMs
  - 🔄 Migrate on-premises file shares
  - 📝 Configuration files
  - SMB/NFS protocol support

### 3. **Queue Storage**

- **Mục đích**: Message queue cho async processing
- **Sử dụng cho**:
  - 📨 Communication giữa services
  - 🔄 Background job processing
  - 📮 Decoupling components
  - Message tối đa 64 KB

### 4. **Table Storage** (NoSQL)

- **Mục đích**: Key-value NoSQL database
- **Sử dụng cho**:
  - 📊 Structured non-relational data
  - 🚀 Fast queries với partition key
  - 💰 Chi phí thấp cho big data

---

## 🏗️ Kiến Trúc Azure Storage Trong Tickify

```
Storage Account (tickifystorage)
│
├── Blob Containers
│   ├── event-images (public read) ✅ Week 1-2
│   ├── user-avatars (public read) → Week 3
│   ├── tickets (private) → Week 4
│   └── backups (cool tier) → Week 5
│
├── Queues
│   └── email-queue → Week 4-5
│
└── Tables
    ├── eventviews → Week 5
    └── audit-logs → Week 5
```

---

## 📅 Implementation Timeline

### **WEEK 1: Foundation Setup** ✅ (COMPLETED)

**Đã Implement**:

```
✅ Azure Storage Account Setup
✅ Blob Container: event-images
✅ IAzureStorageService.cs - Interface
✅ AzureStorageService.cs - Implementation
✅ ImageController.cs - REST API
✅ appsettings.json - Connection String
```

**Files Created**:

- `Interfaces/Services/IAzureStorageService.cs`
- `Services/AzureStorageService.cs`
- `Controllers/ImageController.cs`

**API Endpoints**:

```
POST   /api/image/upload          - Upload image
GET    /api/image/url/{fileName}  - Get SAS URL
DELETE /api/image/{fileName}      - Delete image
```

---

### **WEEK 2: Event Management - Image Integration**

#### **Backend Implementation**

**1. Update EventService.cs**

```csharp
public async Task<EventResponseDto> CreateEventAsync(CreateEventDto dto)
{
    // Upload thumbnail
    var thumbnailFileName = await _azureStorageService
        .UploadImageAsync(dto.ThumbnailFile, "event-images");

    var eventEntity = new Event
    {
        Title = dto.Title,
        ThumbnailUrl = thumbnailFileName, // Save filename only
        // ... other properties
    };

    await _eventRepository.AddAsync(eventEntity);

    // Upload additional images
    foreach (var imageFile in dto.Images)
    {
        var fileName = await _azureStorageService
            .UploadImageAsync(imageFile, "event-images");

        await _eventImageRepository.AddAsync(new EventImage
        {
            EventId = eventEntity.Id,
            ImageUrl = fileName
        });
    }

    return _mapper.Map<EventResponseDto>(eventEntity);
}

public async Task<EventResponseDto> GetEventByIdAsync(int id)
{
    var eventEntity = await _eventRepository.GetByIdAsync(id);

    // Generate SAS URLs (1 hour expiry)
    eventEntity.ThumbnailUrl = await _azureStorageService
        .GetImageUrlAsync(eventEntity.ThumbnailUrl, "event-images");

    foreach (var image in eventEntity.Images)
    {
        image.ImageUrl = await _azureStorageService
            .GetImageUrlAsync(image.ImageUrl, "event-images");
    }

    return _mapper.Map<EventResponseDto>(eventEntity);
}
```

**2. Update EventController.cs**

```csharp
[HttpPost]
[Authorize(Roles = "Organizer")]
public async Task<IActionResult> CreateEvent([FromForm] CreateEventDto dto)
{
    var result = await _eventService.CreateEventAsync(dto);
    return CreatedAtAction(nameof(GetEvent), new { id = result.Id }, result);
}

[HttpGet("{id}")]
public async Task<IActionResult> GetEvent(int id)
{
    var result = await _eventService.GetEventByIdAsync(id);
    return Ok(result);
}
```

#### **Frontend Implementation**

**OrganizerWizard.tsx**

```typescript
const handleEventSubmit = async (data: EventFormData) => {
  const formData = new FormData();

  // Add text fields
  formData.append("title", data.title);
  formData.append("description", data.description);
  // ... other fields

  // Add thumbnail
  formData.append("thumbnailFile", data.thumbnail);

  // Add multiple images
  data.images.forEach((image, index) => {
    formData.append(`images`, image);
  });

  const response = await fetch("/api/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const event = await response.json();
  navigate(`/event/${event.id}`);
};
```

**EventDetail.tsx**

```typescript
const EventDetail = ({ eventId }: Props) => {
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => setEvent(data));
  }, [eventId]);

  return (
    <div>
      <img
        src={event.thumbnailUrl} // Azure SAS URL
        alt={event.title}
      />

      <ImageGallery
        images={event.images.map((img) => ({
          original: img.imageUrl, // Azure SAS URL
          thumbnail: img.imageUrl,
        }))}
      />
    </div>
  );
};
```

---

### **WEEK 3: User Profile - Avatar Upload**

#### **Backend Implementation**

**1. Create new container "user-avatars"**

```csharp
// In Program.cs or Startup
var blobServiceClient = new BlobServiceClient(
    configuration["Azure:StorageAccount:ConnectionString"]
);

var avatarContainer = blobServiceClient.GetBlobContainerClient("user-avatars");
await avatarContainer.CreateIfNotExistsAsync(PublicAccessType.Blob);
```

**2. Update UserService.cs**

```csharp
public async Task<UserResponseDto> UpdateProfilePictureAsync(
    int userId,
    IFormFile file)
{
    var user = await _userRepository.GetByIdAsync(userId);

    // Delete old avatar if exists
    if (!string.IsNullOrEmpty(user.ProfilePicture))
    {
        await _azureStorageService.DeleteImageAsync(
            user.ProfilePicture,
            "user-avatars"
        );
    }

    // Upload new avatar
    var fileName = await _azureStorageService.UploadImageAsync(
        file,
        "user-avatars"
    );

    user.ProfilePicture = fileName;
    await _userRepository.UpdateAsync(user);

    return _mapper.Map<UserResponseDto>(user);
}
```

**3. Add UserController endpoint**

```csharp
[HttpPost("profile/avatar")]
[Authorize]
public async Task<IActionResult> UpdateAvatar([FromForm] IFormFile file)
{
    var userId = GetCurrentUserId();
    var result = await _userService.UpdateProfilePictureAsync(userId, file);
    return Ok(result);
}
```

#### **Frontend Implementation**

**UserProfile.tsx**

```typescript
const handleAvatarUpload = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/users/profile/avatar", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
    body: formData,
  });

  const updatedUser = await response.json();
  authStore.setUser(updatedUser);
};

return (
  <div>
    <Avatar src={user.profilePictureUrl} size="large" />
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          handleAvatarUpload(e.target.files[0]);
        }
      }}
    />
  </div>
);
```

---

### **WEEK 4: Ticketing - PDF Generation & Private Storage**

#### **Backend Implementation**

**1. Install NuGet Package**

```bash
dotnet add package QuestPDF
# or
dotnet add package iTextSharp
```

**2. Create TicketPdfService.cs**

```csharp
public class TicketPdfService
{
    private readonly IAzureStorageService _azureStorageService;

    public async Task<string> GenerateTicketPdfAsync(Booking booking)
    {
        // Generate PDF using QuestPDF
        var pdfBytes = CreateTicketPdf(booking);

        // Upload to private container
        var fileName = $"ticket-{booking.Id}-{Guid.NewGuid()}.pdf";
        var stream = new MemoryStream(pdfBytes);

        await _azureStorageService.UploadFileAsync(
            stream,
            fileName,
            "tickets",
            "application/pdf"
        );

        return fileName;
    }

    private byte[] CreateTicketPdf(Booking booking)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Content().Column(column =>
                {
                    column.Item().Text(booking.Event.Title)
                        .FontSize(24).Bold();
                    column.Item().Text($"Booking ID: {booking.Id}");
                    column.Item().Text($"User: {booking.User.FullName}");
                    // ... QR code, seat info, etc.
                });
            });
        });

        return document.GeneratePdf();
    }
}
```

**3. Update BookingService.cs**

```csharp
public async Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto)
{
    var booking = new Booking
    {
        UserId = dto.UserId,
        EventId = dto.EventId,
        // ... other properties
    };

    await _bookingRepository.AddAsync(booking);

    // Generate and upload ticket PDF
    var pdfFileName = await _ticketPdfService.GenerateTicketPdfAsync(booking);
    booking.TicketPdfUrl = pdfFileName;
    await _bookingRepository.UpdateAsync(booking);

    return _mapper.Map<BookingResponseDto>(booking);
}
```

**4. Add secure download endpoint**

```csharp
[HttpGet("my-tickets/{bookingId}/download")]
[Authorize]
public async Task<IActionResult> DownloadTicket(int bookingId)
{
    var booking = await _bookingService.GetByIdAsync(bookingId);

    // Security check
    if (booking.UserId != GetCurrentUserId())
        return Forbid();

    // Generate short-lived SAS URL (5 minutes)
    var sasUrl = await _azureStorageService.GetPrivateFileUrlAsync(
        booking.TicketPdfUrl,
        "tickets",
        expiryMinutes: 5
    );

    return Redirect(sasUrl);
}
```

**5. Update AzureStorageService with private file methods**

```csharp
public async Task<string> GetPrivateFileUrlAsync(
    string fileName,
    string containerName,
    int expiryMinutes = 5)
{
    var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
    var blobClient = containerClient.GetBlobClient(fileName);

    var sasBuilder = new BlobSasBuilder
    {
        BlobContainerName = containerName,
        BlobName = fileName,
        Resource = "b",
        ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes)
    };

    sasBuilder.SetPermissions(BlobSasPermissions.Read);

    var sasToken = sasBuilder.ToSasQueryParameters(
        new StorageSharedKeyCredential(_accountName, _accountKey)
    );

    return $"{blobClient.Uri}?{sasToken}";
}
```

#### **Frontend Implementation**

**MyTickets.tsx**

```typescript
const downloadTicket = async (bookingId: number) => {
  const response = await fetch(
    `/api/bookings/my-tickets/${bookingId}/download`,
    {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    }
  );

  if (response.redirected) {
    window.open(response.url, "_blank");
  }
};

return (
  <div>
    {bookings.map((booking) => (
      <div key={booking.id}>
        <h3>{booking.event.title}</h3>
        <button onClick={() => downloadTicket(booking.id)}>
          📥 Download Ticket
        </button>
      </div>
    ))}
  </div>
);
```

---

### **WEEK 4-5: Email Queue System**

#### **Backend Implementation**

**1. Create EmailQueueService.cs**

```csharp
public class EmailQueueService
{
    private readonly QueueClient _queueClient;

    public EmailQueueService(IConfiguration configuration)
    {
        _queueClient = new QueueClient(
            configuration["Azure:StorageAccount:ConnectionString"],
            "email-queue"
        );
        _queueClient.CreateIfNotExists();
    }

    public async Task QueueEmailAsync(EmailDto email)
    {
        var message = JsonSerializer.Serialize(email);
        var base64Message = Convert.ToBase64String(
            Encoding.UTF8.GetBytes(message)
        );

        await _queueClient.SendMessageAsync(base64Message);
    }
}
```

**2. Create EmailWorker.cs (Background Service)**

```csharp
public class EmailWorker : BackgroundService
{
    private readonly QueueClient _queueClient;
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailWorker> _logger;

    public EmailWorker(
        IConfiguration configuration,
        IEmailService emailService,
        ILogger<EmailWorker> logger)
    {
        _queueClient = new QueueClient(
            configuration["Azure:StorageAccount:ConnectionString"],
            "email-queue"
        );
        _emailService = emailService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email Worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var messages = await _queueClient.ReceiveMessagesAsync(
                    maxMessages: 10,
                    cancellationToken: stoppingToken
                );

                foreach (var message in messages.Value)
                {
                    try
                    {
                        // Deserialize message
                        var json = Encoding.UTF8.GetString(
                            Convert.FromBase64String(message.Body.ToString())
                        );
                        var emailDto = JsonSerializer.Deserialize<EmailDto>(json);

                        // Send email
                        await _emailService.SendEmailAsync(
                            emailDto.To,
                            emailDto.Subject,
                            emailDto.Body
                        );

                        // Delete message after success
                        await _queueClient.DeleteMessageAsync(
                            message.MessageId,
                            message.PopReceipt,
                            stoppingToken
                        );

                        _logger.LogInformation(
                            $"Email sent successfully to {emailDto.To}"
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send email");
                        // Message will be retried automatically (max 5 times)
                    }
                }

                // Wait 5 seconds before next poll
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in email worker");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }
    }
}
```

**3. Register in Program.cs**

```csharp
builder.Services.AddSingleton<EmailQueueService>();
builder.Services.AddHostedService<EmailWorker>();
```

**4. Use in BookingService**

```csharp
public async Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto)
{
    var booking = await _bookingRepository.AddAsync(new Booking { ... });

    // Queue confirmation email (async, non-blocking)
    await _emailQueueService.QueueEmailAsync(new EmailDto
    {
        To = booking.User.Email,
        Subject = $"Booking Confirmation - {booking.Event.Title}",
        Body = $"Your booking #{booking.Id} is confirmed!"
    });

    return _mapper.Map<BookingResponseDto>(booking);
}
```

---

### **WEEK 5: Analytics with Table Storage**

#### **Backend Implementation**

**1. Create EventAnalyticsService.cs**

```csharp
public class EventAnalyticsService
{
    private readonly TableClient _tableClient;

    public EventAnalyticsService(IConfiguration configuration)
    {
        _tableClient = new TableClient(
            configuration["Azure:StorageAccount:ConnectionString"],
            "eventviews"
        );
        _tableClient.CreateIfNotExists();
    }

    public async Task LogEventViewAsync(
        int eventId,
        int? userId,
        string ipAddress)
    {
        var entity = new TableEntity
        {
            PartitionKey = eventId.ToString(), // Group by event
            RowKey = Guid.NewGuid().ToString(),
            ["UserId"] = userId,
            ["ViewedAt"] = DateTime.UtcNow,
            ["IpAddress"] = ipAddress
        };

        await _tableClient.AddEntityAsync(entity);
    }

    public async Task<EventAnalyticsDto> GetEventAnalyticsAsync(int eventId)
    {
        var query = _tableClient.QueryAsync<TableEntity>(
            filter: $"PartitionKey eq '{eventId}'"
        );

        var totalViews = 0;
        var uniqueUsers = new HashSet<int>();
        var viewsByDate = new Dictionary<DateTime, int>();

        await foreach (var entity in query)
        {
            totalViews++;

            if (entity.ContainsKey("UserId") && entity["UserId"] != null)
            {
                uniqueUsers.Add((int)entity["UserId"]);
            }

            var viewedAt = (DateTime)entity["ViewedAt"];
            var date = viewedAt.Date;
            viewsByDate[date] = viewsByDate.GetValueOrDefault(date, 0) + 1;
        }

        return new EventAnalyticsDto
        {
            EventId = eventId,
            TotalViews = totalViews,
            UniqueVisitors = uniqueUsers.Count,
            ViewsByDate = viewsByDate
        };
    }
}
```

**2. Add middleware to track views**

```csharp
public class EventViewTrackingMiddleware
{
    private readonly RequestDelegate _next;

    public async Task InvokeAsync(
        HttpContext context,
        EventAnalyticsService analyticsService)
    {
        await _next(context);

        // Track if it's an event detail page
        if (context.Request.Path.StartsWithSegments("/api/events") &&
            context.Request.Method == "GET" &&
            context.Response.StatusCode == 200)
        {
            var eventIdStr = context.Request.RouteValues["id"]?.ToString();
            if (int.TryParse(eventIdStr, out var eventId))
            {
                var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)
                    ?.Value;
                var ipAddress = context.Connection.RemoteIpAddress?.ToString();

                await analyticsService.LogEventViewAsync(
                    eventId,
                    userId != null ? int.Parse(userId) : null,
                    ipAddress
                );
            }
        }
    }
}
```

**3. Add analytics endpoint**

```csharp
[HttpGet("{id}/analytics")]
[Authorize(Roles = "Organizer")]
public async Task<IActionResult> GetEventAnalytics(int id)
{
    var analytics = await _eventAnalyticsService.GetEventAnalyticsAsync(id);
    return Ok(analytics);
}
```

---

## 📊 Performance Tiers & Cost Optimization

### **Hot Tier** (Default)

```csharp
// For frequently accessed images
var uploadOptions = new BlobUploadOptions
{
    AccessTier = AccessTier.Hot
};
```

### **Cool Tier** (For backups)

```csharp
// For infrequent access
var uploadOptions = new BlobUploadOptions
{
    AccessTier = AccessTier.Cool // Lower storage cost
};
```

### **Lifecycle Management Policy**

```json
{
  "rules": [
    {
      "name": "MoveOldEventsToArchive",
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["event-images/"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 90
            },
            "tierToArchive": {
              "daysAfterModificationGreaterThan": 365
            },
            "delete": {
              "daysAfterModificationGreaterThan": 730
            }
          }
        }
      }
    }
  ]
}
```

---

## 🔒 Security Best Practices

### **1. Use SAS Tokens (Not Public URLs)**

```csharp
// ❌ BAD: Public container
await container.SetAccessPolicyAsync(PublicAccessType.Blob);

// ✅ GOOD: Private container + SAS tokens
await container.SetAccessPolicyAsync(PublicAccessType.None);
var sasUrl = await GetSasUrlAsync(fileName, expiryHours: 1);
```

### **2. Implement CORS**

```csharp
var blobServiceClient = new BlobServiceClient(connectionString);
await blobServiceClient.SetPropertiesAsync(new BlobServiceProperties
{
    Cors = new List<BlobCorsRule>
    {
        new BlobCorsRule
        {
            AllowedOrigins = "https://tickify.com",
            AllowedMethods = "GET,POST,PUT,DELETE",
            AllowedHeaders = "*",
            ExposedHeaders = "*",
            MaxAgeInSeconds = 3600
        }
    }
});
```

### **3. Use Managed Identity (Production)**

```csharp
// ❌ Development: Connection String
var client = new BlobServiceClient(connectionString);

// ✅ Production: Managed Identity (no credentials in code)
var client = new BlobServiceClient(
    new Uri("https://tickifystorage.blob.core.windows.net"),
    new DefaultAzureCredential()
);
```

---

## 🛠️ Testing & Debugging Tools

### **1. Azure Storage Explorer**

- Download: https://azure.microsoft.com/en-us/products/storage/storage-explorer/
- Features: Browse containers, upload/download files, manage access

### **2. Postman Collection**

```json
{
  "info": { "name": "Tickify Storage API" },
  "item": [
    {
      "name": "Upload Image",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/image/upload",
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": "/path/to/image.jpg"
            }
          ]
        }
      }
    }
  ]
}
```

### **3. Local Development with Azurite**

```bash
# Install Azurite (Azure Storage Emulator)
npm install -g azurite

# Run locally
azurite --location ./azurite-data
```

```json
// appsettings.Development.json
{
  "Azure": {
    "StorageAccount": {
      "ConnectionString": "UseDevelopmentStorage=true"
    }
  }
}
```

---

## 📋 Checklist

### Week 1 ✅

- [x] Azure Storage Account created
- [x] Blob container: event-images
- [x] IAzureStorageService interface
- [x] AzureStorageService implementation
- [x] ImageController with 3 endpoints
- [x] appsettings.json configured

### Week 2 (Current Sprint)

- [ ] Update EventService with image upload
- [ ] EventController accepts FormData
- [ ] Frontend: OrganizerWizard image upload
- [ ] Frontend: EventDetail displays Azure images
- [ ] Test: Create event with thumbnail + gallery

### Week 3

- [ ] Create container: user-avatars
- [ ] UserService.UpdateProfilePictureAsync
- [ ] UserController avatar endpoint
- [ ] Frontend: UserProfile avatar upload
- [ ] Test: Upload and display avatar

### Week 4

- [ ] Install QuestPDF package
- [ ] Create container: tickets (private)
- [ ] TicketPdfService implementation
- [ ] GetPrivateFileUrlAsync with short expiry
- [ ] BookingService generates PDF
- [ ] Frontend: Download ticket button
- [ ] Test: Generate and download ticket PDF

### Week 4-5

- [ ] Create queue: email-queue
- [ ] EmailQueueService implementation
- [ ] EmailWorker background service
- [ ] Register EmailWorker in Program.cs
- [ ] Update BookingService to queue emails
- [ ] Test: Email sent asynchronously

### Week 5

- [ ] Create table: eventviews
- [ ] EventAnalyticsService implementation
- [ ] EventViewTrackingMiddleware
- [ ] Analytics endpoint in EventController
- [ ] Frontend: OrganizerDashboard analytics
- [ ] Test: View tracking and analytics

---

## 🚀 Next Steps

1. **Week 2**: Implement event image upload/display
2. **Week 3**: Add user avatar functionality
3. **Week 4**: Ticket PDF generation + Email queue
4. **Week 5**: Analytics with Table Storage

---

## 📚 References

- [Azure Blob Storage Documentation](https://learn.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Queue Storage Documentation](https://learn.microsoft.com/en-us/azure/storage/queues/)
- [Azure Table Storage Documentation](https://learn.microsoft.com/en-us/azure/storage/tables/)
- [SAS Token Documentation](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview)
- [QuestPDF Documentation](https://www.questpdf.com/)

---

**Last Updated**: November 6, 2025  
**Project**: Tickify Event Management  
**Team**: FPT OJT Team
