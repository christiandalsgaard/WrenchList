# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WrenchList is a two-sided tool rental marketplace (React Native/Expo mobile app + Express backend). Users are either **customers** (rent tools) or **hosts** (list tools for rent). Listing categories: workshop, equipment, tools.

## Commands

```bash
# Server (Express API on port 5000)
npm run server:dev          # Dev mode with tsx hot reload

# Client (Expo/React Native)
npm run expo:dev            # Expo dev server (configured for Replit domains)

# Database
npm run db:push             # Push Drizzle schema to Postgres (requires DATABASE_URL)

# Code quality
npm run lint                # ESLint via Expo
npm run lint:fix            # Auto-fix lint issues
npm run check:types         # TypeScript type checking
npm run check:format        # Prettier format check
npm run format              # Auto-format all files

# Production build
npm run expo:static:build   # Build static Expo bundle
npm run server:build        # Bundle server with esbuild
npm run server:prod         # Run production server
```

## Architecture

### Path Aliases
- `@/*` → `./client/*` (configured in both tsconfig.json and babel.config.js via module-resolver)
- `@shared/*` → `./shared/*`
- `@assets/*` → `./attached_assets/*` (babel only)

### Client (Expo 54 / React Native 0.81)
- **Entry:** `client/index.js` → `client/App.tsx`
- **Navigation:** React Navigation v7 with two layers:
  - `RootStackNavigator` — top-level stack with Main tabs + modals (FilterModal, SignIn, CreateAccount, CreateListing, GlobalListingDetail)
  - `MainTabNavigator` — bottom tabs: Explore, Map, Messages, Profile
  - `ExploreStackNavigator` — nested stack inside Explore tab: Explore → Listings → ListingDetail
- **State management:** React Context for auth (`AuthProvider`) and filters (`FilterProvider`), TanStack Query for server data
- **Auth:** Token-less — user object stored in AsyncStorage, no session/JWT tokens. Auth state is client-side only.
- **API calls:** All go through `client/lib/query-client.ts` which builds URLs from `EXPO_PUBLIC_DOMAIN` env var
- **Design system:** `client/constants/theme.ts` — Colors (light/dark), Spacing, BorderRadius, Typography, ListingCategories. Primary: #FF6B35 (Industrial Orange). Icons: Feather from @expo/vector-icons.
- **Reanimated plugin** must remain last in babel.config.js plugins array

### Server (Express + TypeScript)
- **Entry:** `server/index.ts` — sets up CORS (Replit-aware), body parsing, request logging, Expo manifest serving, landing page, then routes
- **Routes:** `server/routes.ts` — REST API under `/api/`:
  - `POST /api/auth/signup`, `POST /api/auth/signin`
  - `GET/POST /api/listings`, `GET /api/listings/:id`
  - `GET /api/users/:id/listings`
- **Storage:** `server/storage.ts` — `DatabaseStorage` class implementing `IStorage` interface, uses Drizzle ORM with node-postgres pool. Passwords hashed with bcrypt (10 rounds).
- Non-API requests serve either Expo manifests (when `expo-platform` header present) or a landing page HTML template

### Shared (`shared/schema.ts`)
- Drizzle ORM table definitions (`users`, `listings`) and Zod validation schemas (`insertUserSchema`, `loginSchema`, `insertListingSchema`)
- Enums: `userRoleEnum` (customer/host), `priceUnitEnum` (hour/day/week), `listingCategoryEnum` (workshop/equipment/tools)
- Prices stored as cents (`priceCents` integer)

### Database
- PostgreSQL via `DATABASE_URL` env var
- Drizzle Kit for migrations (`drizzle.config.ts`, output to `./migrations/`)
- UUIDs generated server-side via `gen_random_uuid()`

## Environment Variables
- `DATABASE_URL` — Postgres connection string (required for server)
- `EXPO_PUBLIC_DOMAIN` — API server domain for client requests (required for client)
- `PORT` — Server port (defaults to 5000)
- Replit-specific: `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS` (used for CORS)

## Key Design Decisions
- Originally built on Replit — CORS setup, Expo dev scripts, and domain handling reflect this. Adapt when running locally.
- No auth middleware — routes trust `hostId` from request body. Auth is honor-system.
- Creating a listing auto-promotes user role from "customer" to "host".
- The app uses React Native New Architecture (`newArchEnabled: true`) and React Compiler (`reactCompiler: true`).
