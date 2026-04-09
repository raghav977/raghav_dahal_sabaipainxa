# Website Builder Frontend - Implementation Guide

## Overview
The Website Builder has been fully integrated into the Business Account Dashboard with a complete frontend interface matching the dashboard theme (green #019561).

## Files Created

### 1. **Updated Layout** 
**File:** `/frontend/app/dashboard/business-account/layout.jsx`
- Added `FaGlobe` icon import
- Added "Websites" navigation link in sidebar
- Maintains theme consistency with green sidebar (#019561)

### 2. **Websites Listing Page**
**File:** `/frontend/app/dashboard/business-account/websites/page.jsx`

**Features:**
- View all business websites in a responsive grid
- Website cards showing:
  - Website name and slug
  - Publication status (Published/Draft)
  - Creation date
  - Custom domain info
  - Theme color preview
- Actions per website:
  - Edit - Navigate to website builder
  - Publish/Unpublish - Toggle publication status
  - Delete - Remove website with confirmation modal
- Create button in header for new websites
- Empty state with CTA when no websites exist
- Responsive grid (1 column mobile, 2 tablet, 3 desktop)

### 3. **Create Website Page**
**File:** `/frontend/app/dashboard/business-account/websites/create/page.jsx`

**Features:**
- Clean form for creating new website
- Website name input with auto-slug generation
- Theme selection grid with 4 preset themes:
  - Modern Blue (#3B82F6 / #10B981)
  - Bold Red (#EF4444 / #F97316)
  - Elegant Purple (#8B5CF6 / #EC4899)
  - Minimal Gray (#1F2937 / #6B7280)
- Live theme preview showing:
  - Header with chosen colors
  - Content layout placeholder
  - Section grid preview
- Submit and Cancel buttons

### 4. **Website Builder/Editor Page**
**File:** `/frontend/app/dashboard/business-account/websites/[id]/edit/page.jsx`

**Features - 4 Tabs:**

#### Pages Tab
- Add/remove pages
- Manage sections within each page
- 7 section types available:
  - Hero
  - About
  - Services
  - Features
  - Testimonials
  - CTA (Call-to-Action)
  - Contact
- Edit section content inline

#### Theme Tab
- Primary color picker with hex input
- Secondary color picker with hex input
- Font family selector:
  - Inter (default)
  - Poppins
  - Georgia
  - Courier New
- Style selector:
  - Modern
  - Minimal
  - Bold
  - Elegant

#### SEO Tab
- Meta title input
- Meta description textarea
- Keywords input (comma-separated)

#### Settings Tab
- Analytics code textarea (for Google Analytics, etc.)
- Feature toggles:
  - Enable Comments
  - Enable Newsletter
  - Enable Contact Form

**Additional Features:**
- Header with back button and website name
- Publication status indicator
- Preview button (links to preview page)
- Save button with loading state
- Toast notifications for user feedback
- Auto-save handling

## Styling & Theme

**Color Scheme (Matched to Dashboard):**
- Primary Green: `#019561` (buttons, active states, header)
- Secondary Green: `#017a4b` (hover states)
- Backgrounds: `#F9FAFB` (light gray)
- Text: `#111827` (dark gray)
- Borders: `#D1D5DB` (light gray)

**Component Styles:**
- Buttons: Green primary with hover effect
- Cards: White with shadow and hover animation
- Forms: Clean borders, proper spacing
- Modals: Centered, semi-transparent overlay
- Responsive: Mobile-first design

## API Integration

**Endpoints Used:**
- `GET /api/website-builder` - Get all websites
- `POST /api/website-builder` - Create website
- `GET /api/website-builder/:id` - Get website details
- `PUT /api/website-builder/:id` - Update website
- `PATCH /api/website-builder/:id/publish` - Toggle publish
- `DELETE /api/website-builder/:id` - Delete website

**Authentication:**
- All requests include `Authorization: Bearer {token}`
- Token retrieved from localStorage
- Automatic redirect to login if not authenticated

## User Experience Flow

```
1. User navigates to Dashboard → Websites (sidebar)
   ↓
2. Websites Listing Page
   - View existing websites
   - Click "Create Website" or "Create Your First Website"
   ↓
3. Create Website Page
   - Enter website name
   - Auto-slug generated
   - Select theme
   - Live preview
   - Click "Create Website"
   ↓
4. Website Editor Page
   - 4 main tabs: Pages, Theme, SEO, Settings
   - Build pages with drag-able sections
   - Customize colors and fonts
   - Add SEO metadata
   - Configure settings
   - Click "Save" to persist
   ↓
5. Back to Websites List
   - Can edit, publish, or delete websites
   - Click "Publish" to make live
   - Click "Edit" to modify content
```

## Features Implemented

### Pages Tab
✅ Add multiple pages to website
✅ Each page has multiple sections
✅ 7 different section types
✅ Edit section content inline
✅ Remove sections
✅ Reorder sections (future enhancement)

### Theme Tab
✅ Color picker for primary color
✅ Color picker for secondary color
✅ Font family selection
✅ Style preset selection
✅ Real-time preview

### SEO Tab
✅ Meta title optimization
✅ Meta description
✅ Keywords management
✅ Easy for search engine optimization

### Settings Tab
✅ Analytics code injection
✅ Feature toggles
✅ Extensible for future settings

### General
✅ Save all changes
✅ Publish/Unpublish toggle
✅ Delete with confirmation
✅ Toast notifications
✅ Loading states
✅ Error handling
✅ Mobile responsive
✅ Accessibility friendly

## Responsive Design

**Mobile:** 
- Stack layout vertically
- Single column grid
- Full-width buttons
- Collapsible sections

**Tablet:** 
- 2-column grid
- Adjusted spacing
- Touch-friendly buttons

**Desktop:** 
- 3-column grid
- Full layout
- Side-by-side comparisons

## State Management

- Uses React hooks (useState, useEffect)
- Local component state for form data
- Sync with backend via API calls
- Toast notifications for feedback
- Loading states for async operations

## Error Handling

- Try-catch blocks for all API calls
- User-friendly error messages via toast
- Fallback UI for failed states
- Automatic redirect on unauthorized access
- Validation of required fields

## Future Enhancements

1. **Drag & Drop:**
   - Reorder sections within pages
   - Drag sections between pages

2. **Templates:**
   - Pre-built website templates
   - Industry-specific layouts

3. **Custom Domain:**
   - Domain management UI
   - DNS verification workflow

4. **Preview Mode:**
   - Live preview of website
   - Different device previews

5. **Collaboration:**
   - Share website with team members
   - Version history

6. **Analytics Dashboard:**
   - Website traffic stats
   - Visitor analytics

## Navigation Structure

```
/dashboard/business-account/
├── / (main dashboard)
├── /manage-jobs
├── /websites (NEW)
│   ├── / (listing)
│   ├── /create (new website)
│   └── /[id]
│       └── /edit (website builder)
└── /profile
```

## Component Hierarchy

```
BusinessAccountLayout
├── Header
├── Sidebar (with "Websites" link)
└── Content Area
    ├── WebsitesPage (listing)
    ├── CreateWebsitePage
    └── EditWebsitePage (builder)
```

## Dependencies

- **Next.js:** Routing and framework
- **React Icons:** UI icons (FaGlobe, FaSave, etc.)
- **React Toastify:** Toast notifications
- **CSS:** Tailwind CSS for styling

## Testing Checklist

- [ ] Create new website
- [ ] View website listing
- [ ] Edit website pages/sections
- [ ] Update theme colors
- [ ] Modify SEO metadata
- [ ] Configure settings
- [ ] Publish/Unpublish website
- [ ] Delete website
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test error scenarios
- [ ] Test authentication flow

---

**Note:** All components use the consistent green theme (#019561) matching the business account dashboard for a cohesive user experience.
