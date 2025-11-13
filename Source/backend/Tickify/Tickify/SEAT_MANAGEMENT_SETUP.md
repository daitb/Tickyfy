# 🎟️ Seat Management System - Setup Guide

## 📋 Overview

Complete backend implementation for flexible seat selection system supporting:

- **Zone-based selection** (VIP, Standard, etc.)
- **Individual seat selection** within zones
- **Customizable seat maps** per event
- **Multiple layout types** (grid, theater, stadium, custom)
- **Organizer builder tools** for creating seat maps
- **Real-time seat availability** tracking

---

## ✅ What's Been Implemented

### 1. Database Models

#### **SeatMap** (`Models/SeatMap.cs`)

Container for entire venue seating layout

```csharp
- EventId (link to Event)
- Name (e.g., "Main Hall", "Theater 1")
- Description
- TotalRows, TotalColumns
- LayoutConfig (JSON: { type: "grid", orientation: "front" })
- IsActive
- Navigation: Event, SeatZones collection
```

#### **SeatZone** (`Models/SeatZone.cs`)

Zones/sections within a seat map

```csharp
- SeatMapId (link to SeatMap)
- TicketTypeId (link to pricing tier)
- Name (e.g., "VIP Section", "Zone A")
- Color (hex code for UI)
- Description
- StartRow, EndRow, StartColumn, EndColumn (grid boundaries)
- ZonePrice (zone-level pricing)
- Capacity, AvailableSeats
- Navigation: SeatMap, TicketType, Seats collection
```

#### **Seat** (Updated `Models/Seat.cs`)

Individual seats with enhanced properties

```csharp
NEW PROPERTIES:
- SeatZoneId (nullable, links to zone)
- GridRow, GridColumn (visual placement)
- Status (Available, Reserved, Blocked)
- ReservedByUserId (who reserved it)
- ReservedUntil (expiry timestamp)

EXISTING:
- TicketTypeId, Row, SeatNumber
- IsBlocked, BlockedReason
```

### 2. DTOs (`DTOs/SeatMapDTOs.cs`)

Complete set of Data Transfer Objects:

- `CreateSeatMapDto` - Create new seat map
- `UpdateSeatMapDto` - Update existing map
- `SeatMapResponseDto` - Return seat map with zones and seats
- `SeatZoneResponseDto` - Zone with seats
- `SeatResponseDto` - Individual seat data
- `CreateSeatZoneDto` - Create zone
- `CreateSeatDto` - Create individual seat
- `ReserveSeatDto` - Reserve seats (list of seat IDs)
- `ReleaseSeatDto` - Release seats

### 3. Repository Layer (`Repositories/SeatMapRepository.cs`)

Data access with 8 methods:

- `GetByIdAsync(int id)` - Get seat map with zones and seats
- `GetByEventIdAsync(int eventId)` - All maps for event
- `GetActiveByEventIdAsync(int eventId)` - Only active maps
- `CreateAsync(SeatMap)` - Create new seat map
- `UpdateAsync(SeatMap)` - Update existing map
- `DeleteAsync(int id)` - Soft delete (set IsActive = false)
- `ExistsAsync(int id)` - Check if exists
- `GetWithAvailabilityAsync(int id)` - Get with seat status

### 4. Service Layer (`Services/SeatMapService.cs`)

Business logic with 9 methods:

- `CreateSeatMapAsync(CreateSeatMapDto)` - Create with validation
- `UpdateSeatMapAsync(int id, UpdateSeatMapDto)` - Update with validation
- `GetSeatMapByIdAsync(int id)` - Get by ID
- `GetSeatMapsByEventIdAsync(int eventId)` - Get all for event
- `DeleteSeatMapAsync(int id)` - Soft delete
- `GetSeatAvailabilityAsync(int mapId)` - Check seat availability
- `ReserveSeatsAsync(int mapId, ReserveSeatDto)` - Reserve seats
- `ReleaseSeatsAsync(int mapId, ReleaseSeatDto)` - Release seats
- `GenerateGridLayoutAsync(int eventId, CreateSeatMapDto)` - Auto-generate grid

### 5. Controller (`Controllers/SeatMapController.cs`)

RESTful API with 8 endpoints:

| Method | Endpoint                          | Authorization   | Description        |
| ------ | --------------------------------- | --------------- | ------------------ |
| GET    | `/api/seatmaps/{id}`              | None            | Get seat map       |
| GET    | `/api/seatmaps/event/{eventId}`   | None            | Get maps by event  |
| GET    | `/api/seatmaps/{id}/availability` | None            | Check availability |
| POST   | `/api/seatmaps`                   | Organizer/Admin | Create seat map    |
| PUT    | `/api/seatmaps/{id}`              | Organizer/Admin | Update seat map    |
| DELETE | `/api/seatmaps/{id}`              | Organizer/Admin | Delete seat map    |
| POST   | `/api/seatmaps/{id}/reserve`      | Authenticated   | Reserve seats      |
| POST   | `/api/seatmaps/{id}/release`      | Organizer/Admin | Release seats      |

### 6. AutoMapper Profiles (`Mappings/MappingProfile.cs`)

Mappings added:

- `SeatMap` ↔ `SeatMapResponseDto`
- `CreateSeatMapDto` → `SeatMap`
- `UpdateSeatMapDto` → `SeatMap`
- `SeatZone` ↔ `SeatZoneResponseDto`
- `CreateSeatZoneDto` → `SeatZone`
- `Seat` → `SeatResponseDto` (with computed properties)

### 7. Dependency Injection (`Program.cs`)

Services registered:

```csharp
builder.Services.AddScoped<ISeatMapRepository, SeatMapRepository>();
builder.Services.AddScoped<ISeatMapService, SeatMapService>();
```

### 8. Documentation

- **FIGMA_SEAT_SELECTION_PROMPT.md** - Comprehensive UI design prompt
  - Customer seat selection view
  - Organizer seat map builder
  - Seat status management
  - Mobile responsive designs
  - 5 detailed components with specifications

---

## 🚀 Setup Instructions

### Step 1: Database Migration

#### Option A: Entity Framework Migration (Recommended)

```bash
cd Source/backend/Tickify/Tickify
dotnet ef migrations add AddSeatManagementSystem
dotnet ef database update
```

#### Option B: Manual SQL Script

Run `Migrations/AddSeatManagementSystem.sql` in SQL Server Management Studio or Azure Data Studio.

The migration will:

- Create `SeatMaps` table
- Create `SeatZones` table
- Add columns to `Seats` table:
  - `SeatZoneId` (nullable int)
  - `GridRow`, `GridColumn` (nullable int)
  - `Status` (nvarchar)
  - `ReservedByUserId` (nullable int)
  - `ReservedUntil` (datetime2)
  - `UpdatedAt` (datetime2)
- Create foreign keys and indexes

### Step 2: Update ApplicationDbContext (if using EF migrations)

Open `Data/ApplicationDbContext.cs` and add:

```csharp
public DbSet<SeatMap> SeatMaps { get; set; }
public DbSet<SeatZone> SeatZones { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // SeatMap relationships
    modelBuilder.Entity<SeatMap>()
        .HasOne(sm => sm.Event)
        .WithMany()
        .HasForeignKey(sm => sm.EventId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<SeatMap>()
        .HasMany(sm => sm.Zones)
        .WithOne(sz => sz.SeatMap)
        .HasForeignKey(sz => sz.SeatMapId)
        .OnDelete(DeleteBehavior.Cascade);

    // SeatZone relationships
    modelBuilder.Entity<SeatZone>()
        .HasOne(sz => sz.TicketType)
        .WithMany()
        .HasForeignKey(sz => sz.TicketTypeId)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<SeatZone>()
        .HasMany(sz => sz.Seats)
        .WithOne(s => s.SeatZone)
        .HasForeignKey(s => s.SeatZoneId)
        .OnDelete(DeleteBehavior.SetNull);

    // Seat relationships
    modelBuilder.Entity<Seat>()
        .HasOne(s => s.ReservedByUser)
        .WithMany()
        .HasForeignKey(s => s.ReservedByUserId)
        .OnDelete(DeleteBehavior.SetNull);
}
```

### Step 3: Verify Services Registered

✅ Already done in `Program.cs`:

```csharp
builder.Services.AddScoped<ISeatMapRepository, SeatMapRepository>();
builder.Services.AddScoped<ISeatMapService, SeatMapService>();
```

### Step 4: Verify AutoMapper Configured

✅ Already done in `Mappings/MappingProfile.cs`

### Step 5: Build & Run

```bash
cd Source/backend/Tickify/Tickify
dotnet build
dotnet run
```

Navigate to: `https://localhost:7XXX/swagger` to see API documentation

---

## 🧪 Testing the APIs

### 1. Create Seat Map (Organizer/Admin only)

```bash
POST /api/seatmaps
Authorization: Bearer {organizer_token}
Content-Type: application/json

{
  "eventId": 1,
  "name": "Main Hall",
  "description": "Concert hall seating",
  "totalRows": 20,
  "totalColumns": 30,
  "layoutConfig": "{\"type\":\"grid\",\"orientation\":\"front\"}"
}
```

### 2. Get Seat Map

```bash
GET /api/seatmaps/1
```

Response:

```json
{
  "id": 1,
  "eventId": 1,
  "name": "Main Hall",
  "totalRows": 20,
  "totalColumns": 30,
  "zones": [...],
  "isActive": true
}
```

### 3. Get Seat Availability

```bash
GET /api/seatmaps/1/availability
```

### 4. Reserve Seats (Any authenticated user)

```bash
POST /api/seatmaps/1/reserve
Authorization: Bearer {user_token}

{
  "seatIds": [1, 2, 3],
  "userId": 123
}
```

### 5. Update Seat Map (Organizer/Admin)

```bash
PUT /api/seatmaps/1

{
  "name": "Main Concert Hall",
  "isActive": true
}
```

### 6. Release Seats (Organizer/Admin)

```bash
POST /api/seatmaps/1/release

{
  "seatIds": [1, 2, 3],
  "reason": "Booking cancelled"
}
```

---

## 📊 Database Schema

```
Events
  └─── SeatMaps (1-to-many)
         ├── Id
         ├── EventId (FK)
         ├── Name
         ├── TotalRows, TotalColumns
         ├── LayoutConfig (JSON)
         └── SeatZones (1-to-many)
               ├── Id
               ├── SeatMapId (FK)
               ├── TicketTypeId (FK)
               ├── Name, Color
               ├── StartRow, EndRow, StartColumn, EndColumn
               ├── ZonePrice, Capacity, AvailableSeats
               └── Seats (1-to-many)
                     ├── Id
                     ├── SeatZoneId (FK, nullable)
                     ├── TicketTypeId (FK)
                     ├── Row, SeatNumber
                     ├── GridRow, GridColumn
                     ├── Status
                     ├── ReservedByUserId (FK User, nullable)
                     ├── ReservedUntil
                     └── IsBlocked, BlockedReason
```

---

## 🎨 Frontend Implementation (Next Steps)

### 1. Use Figma Prompt

Open `FIGMA_SEAT_SELECTION_PROMPT.md` and feed it to Figma AI to generate:

- Customer seat selection view (theater grid with color coding)
- Organizer seat map builder (drag-drop interface)
- Seat status management dashboard
- Mobile responsive designs

### 2. Create React Components

```tsx
// Customer View
<SeatMapViewer eventId={1} />
  ├── <SeatGrid seats={seats} onSeatClick={handleSelect} />
  ├── <ZoneLegend zones={zones} />
  └── <SelectedSeatsSummary selected={selected} total={total} />

// Organizer View
<SeatMapBuilder eventId={1} />
  ├── <LayoutSelector type={type} onChange={setType} />
  ├── <GridEditor rows={rows} cols={cols} />
  ├── <ZoneCreator onAddZone={handleAddZone} />
  └── <SeatMapPreview data={mapData} />
```

### 3. API Integration

```typescript
// services/seatMapService.ts
export const getSeatMap = (id: number) => api.get(`/seatmaps/${id}`);

export const getSeatAvailability = (id: number) =>
  api.get(`/seatmaps/${id}/availability`);

export const reserveSeats = (mapId: number, seatIds: number[]) =>
  api.post(`/seatmaps/${mapId}/reserve`, { seatIds });

export const createSeatMap = (data: CreateSeatMapDto) =>
  api.post("/seatmaps", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
```

### 4. State Management (Zustand/Redux)

```typescript
interface SeatSelectionStore {
  selectedSeats: Seat[];
  addSeat: (seat: Seat) => void;
  removeSeat: (seatId: number) => void;
  clearSeats: () => void;
  totalPrice: number;
}
```

---

## 🔄 Real-time Features (Future Enhancement)

### Add SignalR for Live Seat Updates

```csharp
// Hub/SeatHub.cs
public class SeatHub : Hub
{
    public async Task NotifySeatReserved(int seatId)
    {
        await Clients.All.SendAsync("SeatReserved", seatId);
    }

    public async Task NotifySeatReleased(int seatId)
    {
        await Clients.All.SendAsync("SeatReleased", seatId);
    }
}
```

Frontend:

```typescript
const connection = new HubConnectionBuilder().withUrl("/hub/seat").build();

connection.on("SeatReserved", (seatId) => {
  updateSeatStatus(seatId, "reserved");
});
```

---

## 📝 Sample Test Data

Use this SQL to insert sample seat map for testing:

```sql
-- Insert sample event first (if needed)
INSERT INTO Events (Title, StartDate, Location, MaxCapacity, ...)
VALUES ('Test Concert', '2024-06-01', 'Main Hall', 500, ...);

DECLARE @EventId INT = SCOPE_IDENTITY();

-- Insert seat map
INSERT INTO SeatMaps (EventId, Name, TotalRows, TotalColumns, LayoutConfig, IsActive)
VALUES (@EventId, 'Main Hall', 20, 30, '{"type":"grid","orientation":"front"}', 1);

DECLARE @SeatMapId INT = SCOPE_IDENTITY();

-- Insert ticket types for pricing
INSERT INTO TicketTypes (EventId, Name, Price, TotalQuantity)
VALUES
  (@EventId, 'VIP', 150.00, 100),
  (@EventId, 'Premium', 100.00, 200),
  (@EventId, 'Standard', 50.00, 200);

DECLARE @VipTicketTypeId INT = (SELECT Id FROM TicketTypes WHERE EventId = @EventId AND Name = 'VIP');
DECLARE @PremiumTicketTypeId INT = (SELECT Id FROM TicketTypes WHERE EventId = @EventId AND Name = 'Premium');
DECLARE @StandardTicketTypeId INT = (SELECT Id FROM TicketTypes WHERE EventId = @EventId AND Name = 'Standard');

-- Insert zones
INSERT INTO SeatZones (SeatMapId, TicketTypeId, Name, Color, StartRow, EndRow, StartColumn, EndColumn, ZonePrice, Capacity, AvailableSeats)
VALUES
  (@SeatMapId, @VipTicketTypeId, 'VIP Section', '#FFD700', 1, 5, 10, 20, 150.00, 55, 55),
  (@SeatMapId, @PremiumTicketTypeId, 'Premium', '#00C16A', 6, 12, 5, 25, 100.00, 147, 147),
  (@SeatMapId, @StandardTicketTypeId, 'Standard', '#4F46E5', 13, 20, 1, 30, 50.00, 240, 240);

-- Generate seats for VIP zone
DECLARE @ZoneId INT = (SELECT Id FROM SeatZones WHERE Name = 'VIP Section');
DECLARE @row INT = 1;
DECLARE @seat INT;

WHILE @row <= 5
BEGIN
    SET @seat = 10;
    WHILE @seat <= 20
    BEGIN
        INSERT INTO Seats (TicketTypeId, SeatZoneId, Row, SeatNumber, GridRow, GridColumn, Status)
        VALUES (@VipTicketTypeId, @ZoneId, CHAR(64 + @row), @seat, @row, @seat, 'Available');
        SET @seat = @seat + 1;
    END
    SET @row = @row + 1;
END

-- Repeat for other zones...
```

---

## ✅ Checklist

- [x] Models created (SeatMap, SeatZone)
- [x] Seat model updated (new columns)
- [x] DTOs created (9 DTOs)
- [x] Repository implemented (8 methods)
- [x] Service implemented (9 methods)
- [x] Controller implemented (8 endpoints)
- [x] AutoMapper configured
- [x] Services registered in DI
- [x] SQL migration script created
- [x] Figma design prompt created
- [ ] Database migration run
- [ ] ApplicationDbContext updated (if using EF)
- [ ] APIs tested in Swagger/Postman
- [ ] Frontend components created
- [ ] Integration testing
- [ ] Real-time updates (SignalR)

---

## 📞 Support

If you encounter any issues:

1. Check database migration ran successfully
2. Verify services are registered in `Program.cs`
3. Check AutoMapper profiles are configured
4. Test APIs in Swagger UI
5. Check application logs for errors

**Happy coding! 🚀**
