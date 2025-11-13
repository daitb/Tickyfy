# Figma Prompt - Seat Selection & Seat Map Builder UI

## 🎯 Overview

Design a comprehensive seat selection system for an event ticketing platform called "Tickify". The system needs two main interfaces:

1. **Organizer Seat Map Builder** - Tool for event organizers to create customizable seat maps
2. **User Seat Selection** - Interactive interface for users to select seats when booking tickets

---

## 📐 Design Requirements

### Color Palette

- **Primary**: Teal (#00C16A) - used for available seats, CTAs
- **Secondary**: Indigo/Purple gradient (#4F46E5 to #7C3AED)
- **Seat States**:
  - Available: Light Green (#E8F5E9)
  - Selected: Teal (#00C16A)
  - Sold: Gray (#E0E0E0)
  - Reserved: Orange (#FFA726)
  - Blocked: Red (#EF5350)
  - VIP: Gold (#FFD700)
- **Background**: White (#FFFFFF), Light Gray (#F5F5F5)
- **Text**: Dark Gray (#212121), Medium Gray (#757575)

### Typography

- **Headings**: Inter/SF Pro - Bold, 24-32px
- **Body**: Inter/SF Pro - Regular, 14-16px
- **Seat Labels**: Monospace font - Medium, 12px
- **Buttons**: Inter - Semibold, 14-16px

---

## 🎨 Interface 1: Organizer Seat Map Builder

### Layout Structure

Create a split-screen layout with sidebar + main canvas:

#### Left Sidebar (300px wide)

1. **Event Info Section** (top)
   - Event name
   - Venue name
   - Total capacity counter
2. **Zone/Section Manager**

   - List of created zones
   - Each zone card shows:
     - Zone name (editable)
     - Color picker
     - Price per seat
     - Capacity count
     - Edit/Delete buttons
   - "+ Add New Zone" button (teal)

3. **Drawing Tools Panel**
   - Grid size selector (rows x columns)
   - Seat type selector:
     - Standard seat
     - VIP seat
     - Wheelchair accessible
     - Table (for dining events)
     - Stage/screen area
     - Aisle/walkway
   - Brush mode toggle
   - Eraser mode toggle
   - Clear all button

#### Main Canvas Area

1. **Top Toolbar**

   - Undo/Redo buttons
   - Zoom controls (+/- buttons, fit to screen)
   - Grid toggle
   - Snap to grid toggle
   - Preview mode button
   - Save draft button
   - Publish button (primary, teal)

2. **Canvas**

   - Large zoomable/pannable grid
   - Show coordinate labels (A, B, C... for rows; 1, 2, 3... for columns)
   - Visual grid lines
   - Seats represented as rounded rectangles (40x40px)
   - Seats should have:
     - Row + seat number label (e.g., "A12")
     - Color coding based on zone
     - Hover state showing details
   - Stage/screen indicator at top (gray rectangle with "STAGE" label)
   - Drag-to-select multiple seats for bulk actions
   - Right-click context menu for:
     - Assign to zone
     - Block seat
     - Mark as wheelchair accessible
     - Delete seats

3. **Zone Assignment Mode**
   - Click zone in sidebar, then paint on canvas
   - Seats change color when assigned to zone
   - Show zone boundaries with dashed lines

#### Right Panel (collapsible, 280px)

1. **Seat Details Inspector**

   - When seat(s) selected, show:
     - Row & number
     - Zone assignment
     - Price
     - Status (available/blocked)
     - Accessibility options
   - Bulk edit options when multiple selected

2. **Templates Library**
   - Pre-made layouts:
     - Theater style (rows)
     - Stadium (curved rows)
     - Conference (tables)
     - Concert (standing + seated)
   - Import layout button

---

## 🎨 Interface 2: User Seat Selection

### Layout Structure

#### Header Section

- Event banner image (blurred background)
- Event title overlay
- Date, time, venue info
- Back button (top left)

#### Main Content (3-column layout on desktop, stacked on mobile)

##### Left Column (320px)

1. **Ticket Type Selector**

   - Card-based selection
   - Each card shows:
     - Zone name
     - Color dot indicator
     - Price per seat
     - Available seats count
     - "Select" radio button
   - Highlight selected type with border

2. **Selected Seats Summary**
   - Mini cart component
   - List of selected seats:
     - Seat code (e.g., "A12")
     - Zone name
     - Price
     - Remove button (X)
   - Subtotal
   - Service fee
   - Total price (bold, large)
   - "Continue to Checkout" button (teal, full width)

##### Center Column (Flexible width)

1. **Seat Map Viewer**

   - Top: Stage/Screen indicator with orientation arrow
   - Interactive seat grid
   - Seats displayed as:
     - Small rounded squares (32x32px)
     - Color coded by status
     - Seat label on hover
     - Click to select/deselect
   - Zoom controls (bottom right corner)
   - Pan by dragging
   - Pinch to zoom on mobile
   - Minimap (bottom left) showing full layout with viewport indicator

2. **Map Controls Bar** (above map)
   - View mode toggle: Grid view / List view
   - Filter by zone dropdown
   - Search seat input (e.g., "Find A12")
   - Legend toggle button

##### Right Column (280px, collapsible on mobile)

1. **Legend**

   - Color-coded seat status:
     - Available (with count)
     - Selected (with count)
     - Sold/Unavailable (with count)
     - Your selection
     - Wheelchair accessible icon
   - Zone legend (list of zones with colors)

2. **Quick Info**

   - Best available seats suggestion
   - "Auto-select best seats" button
   - Seat recommendations based on:
     - View quality
     - Center proximity
     - Accessibility needs

3. **Tips & Info**
   - Collapsible accordion with:
     - How to select seats
     - Reservation time limit (countdown timer)
     - Cancellation policy
     - Accessibility info

---

## 🎬 Interactions & States

### Organizer Builder Interactions

1. **Creating Zones**

   - Modal popup for zone creation
   - Form fields: name, color, price, description
   - Visual preview of color on seats

2. **Drawing Seats**

   - Click-and-drag to draw rectangular selection
   - Seats appear with smooth animation
   - Auto-number seats based on row

3. **Editing Zones**

   - Click zone in sidebar to highlight all seats in that zone on canvas
   - Edit panel slides in from right
   - Changes reflect immediately on canvas

4. **Drag & Drop**
   - Drag template from library onto canvas
   - Drag zones to reposition

### User Selection Interactions

1. **Seat Hover State**

   - Tooltip appears showing:
     - Seat code
     - Zone
     - Price
     - View quality indicator (⭐⭐⭐⭐)
   - Seat scales up slightly (1.1x)
   - Cursor changes to pointer

2. **Seat Click**

   - Available seat → Selected (teal highlight, checkmark icon)
   - Selected seat → Deselected (returns to available)
   - Unavailable seat → Shake animation + error message
   - Smooth color transition (0.2s)

3. **Multi-Select**

   - Shift+click to select range
   - Click and drag to select area (rubber band selection)
   - Selected seats pulse briefly

4. **Reservation Timer**

   - Prominent countdown timer at top
   - Changes to orange when < 5 minutes
   - Warning modal at 2 minutes
   - Auto-release seats when expired

5. **Mobile Touch**
   - Tap to select
   - Long press for details
   - Pinch to zoom
   - Two-finger pan

---

## 📱 Responsive Breakpoints

### Desktop (1280px+)

- Full 3-column layout
- Large seat map with comfortable spacing
- All panels visible simultaneously

### Tablet (768px - 1279px)

- 2-column layout (map + sidebar)
- Right panel collapses into drawer
- Slightly smaller seats (28x28px)

### Mobile (< 768px)

- Single column, vertical scroll
- Ticket selector at top (horizontal scroll)
- Full-width seat map
- Selected seats summary fixed at bottom
- Drawer for legend/info
- Larger tap targets (48x48px minimum)

---

## ✨ Special Features

### Organizer Builder

1. **Auto-Layout**

   - Smart seat arrangement algorithm
   - Automatic row lettering and seat numbering
   - Symmetrical layout suggestion

2. **Accessibility Tools**

   - Mark wheelchair accessible seats
   - Companion seat pairing
   - Accessible aisle width indicators

3. **Preview Mode**
   - Switch to user view to test selection experience
   - Share preview link with team

### User Selection

1. **Best Available Algorithm**

   - Highlights recommended seats based on:
     - Center positioning
     - Together seating
     - View angle
     - User's selected quantity

2. **Group Booking**

   - "Keep seats together" toggle
   - Auto-suggest adjacent seats
   - Visual grouping indicator

3. **Seat Comparison**
   - Select up to 3 seats to compare:
     - View from seat (photo if available)
     - Distance from stage
     - Price
     - Accessibility

---

## 🎭 Sample Screens to Design

### For Organizer Builder:

1. Empty canvas state (onboarding)
2. Canvas with partially created seat map
3. Zone creation modal
4. Template selection screen
5. Fully populated seat map (theater style)
6. Mobile editing view

### For User Selection:

1. Initial state (no seats selected)
2. Seat hover tooltip
3. With 3 seats selected
4. Checkout ready state
5. Reservation timer warning
6. Mobile view with drawer open
7. Sold out section view

---

## 🎨 Figma Tips

### Components to Create:

- Seat component (with variants: available, selected, sold, blocked, VIP, wheelchair)
- Zone card component
- Ticket type card
- Legend item
- Timer component
- Tooltip component
- Button variants (primary, secondary, ghost, danger)

### Auto-Layout Usage:

- Use for sidebar panels
- Ticket type cards
- Selected seats list
- Legend items

### Variants:

- Create seat variants for all states
- Button variants for different sizes/states
- Card variants (default, hover, active)

### Prototyping:

- Click interactions for seat selection
- Hover states for tooltips
- Scroll interactions for canvas panning
- Modal overlays
- Timer countdown animation

---

## 📊 Design Principles

1. **Clarity First**: Users should instantly understand which seats are available
2. **Visual Hierarchy**: Important info (price, availability) should stand out
3. **Feedback**: Every interaction should have visual feedback
4. **Accessibility**: High contrast, keyboard navigation, screen reader support
5. **Performance**: Smooth animations, no lag on seat selection
6. **Mobile-First**: Touch-friendly targets, gesture support
7. **Consistency**: Match Tickify's existing design system

---

## 🚀 Deliverables

1. Desktop screens (1920x1080)
2. Tablet screens (768x1024)
3. Mobile screens (375x812)
4. Component library
5. Interactive prototype with key flows:
   - Organizer: Create zone → Draw seats → Publish
   - User: Select ticket type → Choose seats → Checkout
6. Style guide with colors, typography, spacing

---

## 💡 Inspiration References

Look at these for inspiration:

- Ticketmaster seat selection
- StubHub seat map
- Eventbrite seating chart
- Figma canvas tools (for organizer builder)
- Google Sheets grid (for seat grid)
- Adobe XD artboard controls (for zoom/pan)

---

Good luck with your design! 🎨✨
