# Design Guidelines: NAE IT Technology Test Sheet Dashboard

## Design Approach

**Selected System:** Material Design adapted for enterprise productivity
**Rationale:** This is a utility-focused, data-intensive application requiring clear forms, efficient workflows, and professional aesthetics suitable for technical field workers and administrators.

## Core Design Principles

1. **Functional Clarity**: Every element serves a clear purpose in the test sheet workflow
2. **Data Hierarchy**: Clear visual distinction between sections, inputs, and read-only information
3. **Efficient Navigation**: Minimal clicks to complete common tasks
4. **Professional Trust**: Clean, modern interface that reflects NAE IT Technology's technical expertise

---

## Typography

**Primary Font:** Inter (via Google Fonts CDN)
**Secondary Font:** Roboto Mono (for reference numbers and technical data)

**Hierarchy:**

- Page Titles: text-3xl font-bold (Inter)
- Section Headers: text-xl font-semibold
- Form Labels: text-sm font-medium uppercase tracking-wide
- Body Text: text-base font-normal
- Reference Numbers/Technical Data: text-sm font-mono (Roboto Mono)
- Timestamps: text-xs font-mono
- Helper Text: text-xs

---

## Layout System

**Spacing Units:** Consistent use of 4, 6, 8, 12, 16, 24 (Tailwind: p-4, m-6, gap-8, space-y-12, py-16, mb-24)

**Container Strategy:**

- App Shell: Full viewport width with fixed sidebar
- Main Content: max-w-6xl mx-auto with px-6 padding
- Form Sections: max-w-4xl for optimal readability
- Modals/Dialogs: max-w-2xl

**Grid Layouts:**

- Form Fields: grid grid-cols-1 md:grid-cols-2 gap-6
- Test Items List: Single column with clear row separation
- Admin Dashboard: grid grid-cols-1 lg:grid-cols-3 gap-6 for stats/cards

---

## Component Library

### Authentication Pages

**Login Screen:**

- Centered card layout (max-w-md) on neutral background
- NAE IT Technology logo at top (h-12)
- "Test Sheet Management System" subtitle (text-lg)
- Replit Auth button with clear "Sign in with Replit" text
- Domain restriction notice: "Only @NAE.co.za and @gmail.com emails accepted" (text-xs)
- Footer with "Powered by NAE IT Technology" (text-xs)

**Profile Setup (First-time Users):**

- Two-field form for First Name and Last Name
- Clear explanation: "Your initials will be used for reference numbers (e.g., CG01 for Collen Gillen)"
- Preview of generated initials format below inputs

### Application Shell

**Top Navigation Bar:**

- Fixed header (h-16) spanning full width
- NAE IT Technology branding on left
- User profile button on right showing: "[FirstName] [LastName]" with dropdown (Logout, Profile Settings)
- Current page title in center
- Subtle shadow for depth

**Sidebar Navigation (Fixed Left, w-64):**

- Dashboard icon + "Dashboard"
- Document icon + "New Test Sheet"
- Database icon + "My Test Sheets"
- Settings icon + "Admin Panel" (admin users only)
- Active state: Subtle background fill and border-l-4 accent
- Icon size: h-5 w-5
- Spacing: py-3 px-4 for each item

### Dashboard View

**Stats Cards (grid of 3):**

- Total Test Sheets Completed
- Pending Test Sheets
- This Month's Activity
- Each card: Rounded corners (rounded-lg), shadow, p-6
- Large number display (text-4xl font-bold)
- Label below (text-sm)

**Recent Test Sheets Table:**

- Columns: Tech Reference, Date, Customer, Plant Name, Status, Actions
- Striped rows for readability
- Action buttons: View (Eye icon), Export PDF, Export Excel, Delete
- Pagination at bottom if >10 items

### Test Sheet Form (Primary Interface)

**Progress Indicator (Top):**

- Horizontal stepper showing: Plant Details → Tests → Admin/Tech Info → Review
- Active step highlighted with filled circle
- Completed steps with checkmark

**Scrollable Section Panel:**

- Each section in card format (rounded-lg shadow p-8 mb-6)
- Section numbering: "1. Plant Details", "2. Tests", etc.

**Section 1: Plant Details**

- Grid layout for fields (2 columns on desktop)
- Fields: Customer (text), Plant Name (text), Vehicle Make (text), Model (text), Voltage (number)
- Serial ESN (text), SIM-ID (text), IZWI Serial (text), EPS Serial (text)
- Units Replaced (textarea, full width)

**Section 2: Test Items**

- Table layout with 3 columns: Test Name, Status (dropdown), Comment (text input)
- Test items listed: GPS, GSM, Ignition, Internal Battery, Main Battery, Buzzer, Seat Belt, Tag Authentication, Panic, IZWI, Bin-Tip, TPMS, Service Brake
- Status dropdown options: Test OK, Failed, N/A
- Rows with subtle borders, adequate row height (h-16) for comfortable interaction

**Section 3: PDU/EPS & Additional Info**

- PDU Installed (dropdown: Yes/No/N/A)
- EPS Linked (dropdown: Yes/No/N/A)
- Odometer/Engine Hours (number input)
- Notes (textarea, full width, h-32)

**Section 4: Technician & Admin Info**

- Auto-populated: Administrator (current user's name, read-only field)
- Technician Name (text input)
- Technician Job Card No (text input)
- Auto-generated fields displayed prominently:
  - Technology Reference No (large, monospace font, top of form)
  - Admin Reference (large, monospace font)
  - Start Time (auto-captured, read-only)
  - End Time (auto-captured on submit, read-only)

**Action Buttons (Bottom of Form):**

- Primary: "Save & Generate PDF" (large button, w-full md:w-auto)
- Secondary: "Save as Draft"
- Tertiary: "Export to Excel"
- Cancel/Back (text button)
- Button group with gap-4, right-aligned on desktop

### Admin Panel

**Template Management Interface:**

- "Add New Test Template" button (top right)
- List of existing templates as cards
- Each template card shows: Template name, test items count, created date, Edit/Delete actions

**Add/Edit Template Modal:**

- Form to define test categories
- Dynamic list where admin can add/remove test items
- Each item: Name (text), Default status (dropdown)
- Save Template button

### Export Dialogs

**PDF Export Modal:**

- Preview section showing "Generating PDF..."
- Download button appears when ready
- Format preview: "Test Sheet [TechRef].pdf"

**Excel Export Modal:**

- Options: Include all data / Summary only
- Download button
- Format preview: "Test Sheet [TechRef].xlsx"

---

## Component Specifications

### Input Fields

- Height: h-12 for text inputs, h-10 for small inputs
- Border: border rounded focus:ring-2
- Labels: Above input with mb-2
- Helper text below if needed (mt-1)

### Buttons

**Primary Actions:** Solid fill, h-12, px-8, rounded-lg, font-semibold
**Secondary Actions:** Outlined, h-12, px-6, rounded-lg
**Tertiary/Text:** No background, h-10, px-4, underline on hover
**Icon Buttons:** Square (h-10 w-10), rounded-lg, icon centered

### Cards

- Rounded corners: rounded-xl
- Shadow: shadow-md, shadow-lg for elevated states
- Padding: p-6 standard, p-8 for major sections

### Tables

- Header: Sticky top, font-semibold, text-xs uppercase tracking-wider
- Rows: h-14 minimum, border-b
- Hover state: Subtle background change
- Cells: px-4 py-3

### Dropdowns/Selects

- Match text input height (h-12)
- Chevron icon on right
- Options list with max-h-60 overflow-y-auto

---

## Icons

**Library:** Heroicons (via CDN)
**Usage:**

- Navigation: outline style, h-5 w-5
- Buttons: outline style, h-5 w-5
- Status indicators: solid style, h-4 w-4
- Table actions: outline style, h-4 w-4

---

## Animations

**Minimal, purposeful animations only:**

- Page transitions: 150ms fade
- Dropdown menus: 200ms slide-down
- Modal appearance: 200ms fade + scale
- Form field focus: Instant (no animation)
- Loading states: Subtle spinner only

---

## Images

**NAE IT Technology Logo:**

- Placement: Top of login card, left side of top navigation
- Size: h-10 to h-12
- Format: SVG preferred for scalability

**No hero images** - This is a productivity dashboard, not a marketing site. Focus on functional UI elements.

---

## Responsive Behavior

**Breakpoints:**

- Mobile (<768px): Single column, hamburger menu for sidebar
- Tablet (768px-1024px): Sidebar visible, 2-column forms
- Desktop (>1024px): Full layout with fixed sidebar, multi-column grids

**Mobile Priorities:**

- Collapsible sidebar (slide-out drawer)
- Stack form fields to single column
- Maintain touch-friendly button sizes (h-12 minimum)
- Tables scroll horizontally or reformat as cards

---

## Accessibility

- All form inputs with associated labels
- Focus indicators on all interactive elements (ring-2)
- Sufficient contrast ratios throughout
- Keyboard navigation support for all actions
- Screen reader labels for icon-only buttons
- Error messages announced and clearly visible
