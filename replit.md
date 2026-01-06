# Wrench List - Replit.md

## Overview

Wrench List is a two-sided marketplace mobile application for tool and equipment rentals. Built with React Native and Expo, it connects customers looking to rent tools with hosts who list their equipment. The app features location-based discovery, category browsing, messaging, and user profiles with distinct experiences for renters and equipment owners.

**Current State**: MVP with 3 listing categories (Workshop, Equipment, Tools), user authentication (signup/signin), host listing creation flow, and database-backed user and listing storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 for cross-platform mobile development (iOS, Android, web)
- **Navigation**: React Navigation v7 with a hybrid structure:
  - Native stack navigator for root-level screens and modals (RootStackNavigator)
  - Bottom tab navigator for main app sections (Explore, Map, Messages, Profile)
  - Nested stack navigators within Explore tab for category drill-down
- **State Management**: 
  - TanStack React Query for server state and API caching
  - React Context for local filter state (FilterProvider in lib/filterContext.tsx)
  - Component-level state with useState for UI interactions
- **Animations**: React Native Reanimated for performant, spring-based micro-interactions
- **Theming**: Custom theme system supporting light/dark modes via useColorScheme hook

### Backend Architecture
- **Runtime**: Node.js with Express server
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Build Tool**: tsx for development, esbuild for production bundling
- **Static Assets**: Landing page served for web visitors, with support for Expo static builds

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Migrations**: Managed via drizzle-kit (`db:push` command)
- **Current Schema**: Users table with id, displayName, email, phone, password, address, city, state, zipCode, role, createdAt
- **Development Storage**: Mock data system in `client/lib/mockData.ts` for listings

### Security Notes
- **MVP limitation**: Current implementation uses client-supplied hostId; proper session-based auth (JWT/cookies) recommended for production
- **Password hashing**: Uses bcrypt with 10 salt rounds
- **Data validation**: Zod schemas for all form inputs

### Project Structure
```
client/          # React Native/Expo application
  components/    # Reusable UI components (NativeMap, Card, Button, etc.)
  screens/       # Screen components (Explore, Listings, ListingDetail, Map, etc.)
  navigation/    # Navigation configuration
  hooks/         # Custom React hooks (useTheme, useScreenOptions)
  lib/           # Utilities and context (mockData, filterContext, query-client)
  constants/     # Theme and configuration
server/          # Express backend
  routes.ts      # API route definitions
  storage.ts     # Data access layer
shared/          # Code shared between client/server
  schema.ts      # Database schema and types
```

## Implemented Features

### Listing Categories (3 discrete)
1. Workshop/Garage Space
2. Mid-Size Power Equipment
3. Power Tools

### Authentication
- **Sign Up**: Collects name, email, phone, address (street, city, state, ZIP), password with bcrypt hashing
- **Sign In**: Email/password authentication with password visibility toggle
- **AuthProvider Context**: Manages user state with AsyncStorage persistence, includes full address data
- **Menu Modal**: Hamburger menu with Sign In/Create Account options

### Host Flow
- **Category Selection**: Workshop, Equipment, or Tools
- **Listing Form**: Title, description, location, city, photos (up to 5), pricing with unit selection (hour/day/week)
- **User Role**: Automatically updated to "host" when first listing is created

### Screens
- **ExploreScreen**: Main category selection with Wrench List branding
- **ListingsScreen**: Grid/map toggle, filter chips, listing cards
- **ListingDetailScreen**: Full listing info, pricing (hourly/daily/weekly), features, location map, safety requirements
- **MapScreen**: Full-screen map with markers (native) or list fallback (web); listings ordered by proximity to user with distance badges
- **MessagesScreen**: Conditional rendering - sign-in prompt for guests, user context with mock messages for authenticated users
- **ProfileScreen**: User info display (initials avatar, name, email, location, role badge) when signed in; sign-in prompt for guests
- **FilterModal**: Filter by City, Region, State, Proximity

### Platform-Specific Features
- **react-native-maps v1.20.1**: Used only on native platforms (iOS/Android)
- **NativeMap component**: Platform-specific with `.web.tsx` fallback showing list view
- **Location permissions**: Proper handling with Settings button fallback

### Path Aliases
- `@/` → `./client/` (frontend code)
- `@shared/` → `./shared/` (shared code)

## External Dependencies

### Third-Party Services
- **Location Services**: expo-location for GPS-based tool discovery
- **Maps**: react-native-maps for displaying listings on map views

### Key Libraries
- **Expo Modules**: blur effects, haptics, image handling, splash screen, web browser
- **UI**: @expo/vector-icons (Feather icons), expo-glass-effect for iOS visual effects
- **Database**: pg (PostgreSQL client), drizzle-orm, drizzle-zod for schema validation
- **Development**: Prettier, ESLint with Expo config

### Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string
- `EXPO_PUBLIC_DOMAIN`: API server domain for mobile client
- `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS`: Used for CORS configuration and build processes