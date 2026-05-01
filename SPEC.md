# SPEC.md - Modern Content Management Website

## 1. Project Overview

**Project Name:** KB1 Content Management System  
**Type:** Single Page Application (SPA) - Web Platform  
**Core Functionality:** Content management website with login system, CRUD operations, pricing tables, search, and feedback system  
**Target Users:** Admin and general users

---

## 2. UI/UX Specification

### Layout Structure

**Page Sections:**
- Fixed Navigation Bar (height: 64px)
- Main Content Area (full width)
- Floating Action Button (bottom-right for kritik/saran)
- Toast Container (top-right)

**Responsive Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Visual Design

**Color Palette:**
```
--primary: #2563EB        (Blue - buttons, links, highlights)
--primary-dark: #1D4ED8   (Blue darker - hover states)
--primary-light: #DBEAFE  (Blue lighter - backgrounds)
--accent: #1F2937         (Black/Dark Gray - text, icons)
--background: #FFFFFF     (White - main background)
--background-soft: #F8FAFC (Soft gray - cards, sections)
--background-alt: #F1F5F9 (Alternate background)
--border: #E2E8F0         (Light border)
--text-primary: #1F2937   (Main text)
--text-secondary: #64748B (Secondary text)
--text-muted: #94A3B8     (Muted text)
--success: #10B981        (Green - success states)
--error: #EF4444          (Red - error states)
--warning: #F59E0B        (Yellow - warning states)
```

**Typography:**
```
Font Family: 'Poppins', 'Inter', sans-serif
- Heading 1: 32px, font-weight: 700
- Heading 2: 24px, font-weight: 600
- Heading 3: 20px, font-weight: 600
- Body: 16px, font-weight: 400
- Small: 14px, font-weight: 400
- Caption: 12px, font-weight: 400
```

**Spacing System:**
```
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
```

**Visual Effects:**
- Border Radius: 8px (small), 12px (medium), 16px (large), 30px (pill)
- Box Shadow (soft): 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)
- Box Shadow (medium): 0 4px 16px rgba(0,0,0,0.1)
- Box Shadow (large): 0 8px 32px rgba(0,0,0,0.12)
- Transitions: 0.3s ease (default), 0.2s ease (fast)

### Components

**Navigation Bar:**
- Logo left, menu center, logout button right
- Mobile: hamburger menu
- Background: white with subtle shadow

**Login Page:**
- Centered card (max-width: 400px)
- Role selection buttons (Admin/User)
- Password input with show/hide toggle
- Login button (primary blue)
- Error message display

**Content Cards:**
- Horizontal layout (full width)
- Padding: 24px
- Rounded: 12px
- Shadow: soft
- Hover: slight lift effect

**Search Bar:**
- Centered position
- Rounded (30px pill)
- Icon left
- Live search indicator

**Filter Pills:**
- Horizontal scrollable
- Active state: filled blue
- Inactive state: outlined

**Floating Button:**
- Fixed position (bottom-right)
- 56px diameter
- Blue background
- Chat icon
- Hover: scale + shadow

**Modal:**
- Centered overlay
- Rounded corners
- Close button
- Smooth fade-in animation

**Toast:**
- Fixed top-right
- Rounded
- Auto dismiss (3s)
- Slide-in animation

**Loading Skeleton:**
- Animated pulse
- Matching card dimensions

---

## 3. Functionality Specification

### Login System

**Mechanism:**
1. Select role (Admin or User)
2. Enter password
3. Validate against stored credentials
4. Store session in localStorage
5. Redirect to main page

**Credentials:**
- Admin: password = "admin1234"
- User: password = "user1234"

**Auto Login:**
- On page load, check localStorage
- If session exists, auto-redirect to main page
- If no session, show login page

**Logout:**
- Clear localStorage
- Reset to login page
- Animate transition

### Content Management (CRUD)

**Data Structure:**
```javascript
{
  id: string,
  title: string (bold, large),
  date: string (manual input),
  classification: "INFO" | "KATEGORI" | "PROMO",
  subject: string (max 200 chars),
  content: string (rich text with formatting),
  externalLinks: [{name: string, url: string}]
}
```

**Operations (Admin Only):**
- Create: Add new content
- Read: View all content
- Update: Edit existing content
- Delete: Remove content

**Operations (User):**
- Read: View content only
- Search: Filter content

### Content Display

**Card Behavior:**
- Horizontal card layout
- "Selengkapnya" button expands content
- Smooth slide-down animation
- External links as buttons

**Rich Text Editor:**
- Alignment (left, center, right)
- Bold, italic, underline
- Bullet list, numbered list
- Text color
- Hyperlink insertion

### Pricing Menu

**Structure:**
```javascript
{
  id: string,
  bulan: string (Jan-Des),
  regional: "Jawa & Bali" | "Sumatera & Kalimantan",
  jenisPelanggan: "Baru" | "Existing",
  paket: "Reguler" | "HEBAT 3" | "HEBAT 6" | "HEBAT 12" | "HEBAT 24",
  layanan: string,
  biayaPasang: number,
  hargaPaket: number,
  ppn: number (11%),
  total: number
}
```

**Features:**
- Manual input form (Admin)
- Excel upload (Admin)
- Sort by different columns
- Display in bordered boxes

### Search Feature

**Implementation:**
- Live search (debounced 300ms)
- Search fields: title, subject, content
- Highlight matches in blue
- Fuzzy search with typo tolerance

### Filter System

**Pills:**
- INFO
- KATEGORI
- PROMO

**Behavior:**
- Toggle filter on/off
- Multiple filters can be active
- Show "All" option

### Kritik & Saran

**User Flow:**
1. Click floating button
2. Modal opens with form
3. Enter name (optional) and message (required)
4. Submit saves to localStorage
5. Show thank you toast

**Admin Dashboard:**
- View all messages
- Mark as read
- Delete messages
- Card layout with timestamps

### Additional Features

**Pagination:**
- 7 items per page
- Page numbers + prev/next
- Smooth transition

**Sorting:**
- Click column header
- Toggle asc/desc
- Visual indicator

**Toast Notification:**
- Success, error, warning types
- Auto dismiss
- Manual close option

**Loading Skeleton:**
- Show while loading
- Match content layout
- Pulse animation

**Dark Mode:**
- Toggle in navbar
- LocalStorage preference
- Smooth transition

---

## 4. Acceptance Criteria

### Visual Checkpoints
- [ ] Blue dominant color (#2563EB)
- [ ] White background
- [ ] Soft gray accents
- [ ] Rounded corners (8-16px)
- [ ] Soft shadows
- [ ] Smooth animations
- [ ] Responsive on all devices

### Functionality Checkpoints
- [ ] Login works with correct passwords
- [ ] Wrong password shows error
- [ ] Auto login from session
- [ ] Logout clears session
- [ ] Admin can CRUD content
- [ ] User can only view
- [ ] Search highlights results
- [ ] Filters work correctly
- [ ] Kritik/saran saves messages
- [ ] Admin can view/delete messages
- [ ] Pagination works
- [ ] Dark mode toggles

### Performance
- [ ] Page loads under 2s
- [ ] Smooth animations (60fps)
- [ ] No console errors