# Wrench List - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - Two-sided marketplace with distinct user types (customers and hosts).

**Implementation:**
- Use SSO (Apple Sign-In for iOS, Google Sign-In for Android)
- Registration flow must capture user type: "I'm looking to rent tools" (Customer) or "I'm listing tools/equipment" (Host)
- Profile screen includes:
  - User avatar (generate 3 tool-themed preset avatars: wrench, toolbox, hard hat)
  - Display name and location
  - User type badge (Customer/Host)
  - Listings tab (for hosts only)
  - Settings: notification preferences, units (metric/imperial), logout, delete account

### Navigation Architecture
**Root Navigation: Tab Bar (4 tabs + Floating Action Button)**

Tabs:
1. **Explore** - Main category selection and search
2. **Map** - Full-screen map view of all listings
3. **FAB (Center)** - "Create Listing" (hosts only) / "Find Tools" quick search (customers)
4. **Messages** - Chat with hosts/customers
5. **Profile** - User account and settings

### Information Architecture

**Screen Flow:**
1. Onboarding/Auth → User Type Selection → Main App
2. Explore → Category Selection → Filtered Listings → Listing Detail → Contact/Book
3. Hosts: Profile → My Listings → Create/Edit Listing

---

## Screen Specifications

### 1. Explore (Home)
**Purpose:** Category selection gateway and recent/featured listings

**Layout:**
- Transparent header with search icon (right) and notification bell (right)
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl
- Scrollable content

**Components:**
- Hero section with app tagline: "Rent the right tool for the job"
- 5 large category cards in grid (2 columns):
  - Workshop/Garage Space
  - Heavy Machinery
  - Mid-Size Power Equipment
  - Power Tools
  - Hand Tools
- Each card shows category icon, name, and "X listings nearby"
- "Featured Near You" section with horizontal scrollable listing cards

### 2. Listings (Category View)
**Purpose:** Browse and filter listings in selected category

**Layout:**
- Default navigation header with category name as title
- Filter icon (right header button)
- Map/List toggle (right header button)
- Top inset: Spacing.xl (non-transparent header)
- Bottom inset: tabBarHeight + Spacing.xl

**Components:**
- Active filter chips (dismissible) below header
- Toggle between Map View and List View
- **List View:** Vertical scrolling cards showing:
  - Listing photo, title, price per day/hour, distance, host rating
- **Map View:** Full-screen map with listing pins
  - Tapping pin shows compact card overlay at bottom
  - Card shows photo, title, price, "View Details" button
- Filter Modal (slides up from bottom):
  - Location: City, Region, State dropdowns
  - Proximity slider (1-50 miles from user)
  - Price range
  - Availability date picker
  - "Apply Filters" button

### 3. Listing Detail
**Purpose:** View full listing information and contact host

**Layout:**
- Transparent header with back button (left) and share/save icons (right)
- Top inset: headerHeight + Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl (no tab bar on detail screens)
- Scrollable content
- Sticky bottom CTA bar with "Contact Host" and "Book Now" buttons

**Components:**
- Photo carousel (full-width, swipeable)
- Title, host name with avatar, rating
- Price breakdown (hourly/daily/weekly rates)
- Location map pin with address
- Description text
- Features/specifications list
- Availability calendar
- Safety requirements/rules
- Host profile section (profile pic, join date, response rate)
- Reviews section

### 4. Create/Edit Listing (Host)
**Purpose:** Hosts add new tool/equipment listings

**Layout:**
- Default header with "Cancel" (left) and "Publish" (right)
- Top inset: Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl
- Scrollable form

**Components:**
- Photo upload (up to 8 images)
- Category selector (required)
- Title and description fields
- Pricing inputs (hourly, daily, weekly)
- Location address input (with map preview)
- Features/specifications checklist
- Availability settings
- Safety requirements text area
- "Save as Draft" and "Publish Listing" buttons below form

### 5. Messages
**Purpose:** Chat between customers and hosts

**Layout:**
- Default header with "Messages" title
- Top inset: Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl
- List of conversations (not scrollable root, uses FlatList)

**Components:**
- Search bar for filtering conversations
- Conversation list items showing:
  - Other user's avatar and name
  - Listing thumbnail (if applicable)
  - Last message preview
  - Timestamp
  - Unread badge

**Chat Detail Screen:**
- Default header with user name and listing title
- Message bubbles (sent: right-aligned blue, received: left-aligned gray)
- Input field with send button at bottom

### 6. Profile
**Purpose:** User account management and settings

**Layout:**
- Transparent header with settings icon (right)
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl
- Scrollable content

**Components:**
- User avatar (large, center), name, user type badge
- Location and join date
- **For Hosts:** "My Listings" button leading to listings management
- **For Customers:** "Booking History" section
- Settings sections:
  - Account (payment methods, verification)
  - Notifications
  - Units & preferences
  - Help & Support
  - About, Privacy Policy, Terms
  - Log Out / Delete Account (nested in Settings)

---

## Design System

### Color Palette
- **Primary:** Industrial Orange (#FF6B35) - CTAs, active states
- **Secondary:** Steel Blue (#4A90E2) - customer actions, links
- **Accent:** Safety Yellow (#FFD23F) - highlights, warnings
- **Neutral Gray Scale:**
  - Text: #1A1A1A
  - Secondary Text: #666666
  - Borders: #E0E0E0
  - Background: #F8F8F8
  - White: #FFFFFF
- **Success:** #4CAF50
- **Error:** #F44336

### Typography
- **Headings:** SF Pro Display (iOS) / Roboto (Android), Bold, 24-32pt
- **Subheadings:** SF Pro Text / Roboto, Semibold, 18-20pt
- **Body:** SF Pro Text / Roboto, Regular, 15-16pt
- **Caption:** SF Pro Text / Roboto, Regular, 13-14pt
- **Price Text:** SF Pro Display / Roboto, Bold, 20-24pt

### Component Styling
- **Category Cards:** Rounded corners (12px), subtle shadow, image background with gradient overlay
- **Listing Cards:** Rounded corners (8px), white background, 1px border, no shadow
- **CTAs:** Rounded (8px), solid fill with primary color, white text
- **Filter Chips:** Pill-shaped, light gray fill, dismissible X icon
- **Floating Action Button:** Circular, primary orange, drop shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)
- **Map Pins:** Custom orange pin icon with tool category indicator

### Icons
- Use Feather icons from @expo/vector-icons
- Category icons: custom generated assets (wrench, excavator, drill, hammer, toolbox)
- Navigation and UI: Feather standard icons

### Critical Assets
Generate the following assets:
1. **Category Icons (5):** Workshop (garage icon), Heavy Machinery (excavator), Mid-Size Equipment (lawnmower), Power Tools (drill), Hand Tools (hammer)
2. **User Avatars (3 presets):** Wrench avatar, Toolbox avatar, Hard hat avatar
3. **Custom Map Pin:** Orange pin with wrench logo
4. **Empty States:** Illustration for "No listings found"

### Interaction Feedback
- All touchable elements scale to 0.95 on press
- List items have light gray background on press (#F0F0F0)
- Buttons show 80% opacity on press
- Tabs have animated indicator slide
- Filter chips bounce on dismiss

### Accessibility
- Minimum touch target: 44x44pt
- Color contrast ratio 4.5:1 for all text
- All icons have text labels for screen readers
- Form fields have clear error states
- Map pins support VoiceOver with listing details