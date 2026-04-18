# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WrenchList is a two-sided tool rental marketplace (React Native/Expo mobile app + Express backend). Users are either **customers** (rent tools) or **hosts** (list tools for rent). Categories are stored in a database table (not hardcoded) for dynamic growth.

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
- Server and API files use relative imports (not aliases) for Vercel Function compatibility.

### Client (Expo 54 / React Native 0.81)
- **Entry:** `client/index.js` → `client/App.tsx`
- **Navigation:** React Navigation v7 with two layers:
  - `RootStackNavigator` — top-level stack with Main tabs + modals (FilterModal, SignIn, CreateAccount, CreateListing, GlobalListingDetail)
  - `MainTabNavigator` — bottom tabs: Explore, Map, Messages, Profile
  - `ExploreStackNavigator` — nested stack inside Explore tab: Explore → Listings → ListingDetail
- **State management:** React Context for auth (`AuthProvider`) and filters (`FilterProvider`), TanStack Query for server data
- **Auth:** Token-less — user object stored in AsyncStorage, no session/JWT tokens. Auth state is client-side only.
- **API calls:** All go through `client/lib/query-client.ts` — on web uses `window.location.origin` (same-origin), on native uses `EXPO_PUBLIC_DOMAIN` env var.
- **Design system:** `client/constants/theme.ts` — Colors (light/dark), Spacing, BorderRadius, Typography, ListingCategories. Primary: #FF6B35 (Industrial Orange). Icons: Feather from @expo/vector-icons.
- **Reanimated plugin** must remain last in babel.config.js plugins array

### Server (Express + TypeScript)
- **Entry:** `server/index.ts` — sets up CORS (Replit-aware), body parsing, request logging, Expo manifest serving, landing page, then routes
- **Routes:** `server/routes.ts` — REST API under `/api/` (see full route list below)
- **Storage:** `server/storage.ts` — `DatabaseStorage` class implementing `IStorage` interface, uses Drizzle ORM with node-postgres pool. Passwords hashed with bcrypt (10 rounds). All list queries use cursor-based pagination.
- Non-API requests serve either Expo manifests (when `expo-platform` header present) or a landing page HTML template

### Vercel Functions (`api/`)
- Each route is a separate Vercel Function using the Web Request/Response API (not Express).
- Functions import from `server/storage.ts` and `shared/schema.ts` via relative paths.
- Deployed automatically on git push to main.

### Shared (`shared/schema.ts`)
- **Tables:** users, categories, listings, listing_images, listing_embeddings, bookings, reviews, messages, conversations, conversation_messages, events
- **Zod schemas** are written manually (not derived from drizzle-zod) to avoid version-specific type issues.
- **pgvector** custom type defined for listing embeddings (1536 dimensions, cosine similarity).
- Prices stored as cents (priceHourlyCents, priceDailyCents, priceWeeklyCents).
- Lat/long stored as `numeric` (not text) for geo queries.
- Soft deletes via `deletedAt` on users and listings.

### Database
- PostgreSQL via `DATABASE_URL` env var
- Drizzle Kit for migrations (`drizzle.config.ts`, output to `./migrations/`)
- UUIDs generated server-side via `gen_random_uuid()`
- pgvector extension required for semantic search (HNSW index on listing_embeddings)

## API Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/signin | Sign in |
| GET | /api/categories | List categories |
| GET | /api/listings | List listings (paginated, filterable by categoryId/city) |
| POST | /api/listings | Create listing |
| GET | /api/listings/:id | Get listing detail |
| GET | /api/users/:id/listings | Host's listings |
| POST | /api/bookings | Create booking |
| GET | /api/bookings/customer/:id | Customer's bookings |
| GET | /api/bookings/host/:id | Host's bookings |
| PATCH | /api/bookings/:id/status | Update booking status |
| POST | /api/reviews | Create review |
| GET | /api/reviews/listing/:id | Reviews for a listing |
| POST | /api/messages | Send message |
| GET | /api/messages/:userId/:otherUserId | Message thread |
| GET | /api/messages/inbox/:userId | Conversation previews |
| POST | /api/events | Track interaction event (fire-and-forget) |

All list endpoints support cursor-based pagination: `?cursor=<ISO timestamp>&cursorId=<id>&limit=<n>`

## Environment Variables
- `DATABASE_URL` — Postgres connection string (required for server)
- `EXPO_PUBLIC_DOMAIN` — API server domain for native client requests
- `PORT` — Server port (defaults to 5000)
- Replit-specific: `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS` (used for CORS)

## Key Design Decisions
- Originally built on Replit — CORS setup, Expo dev scripts, and domain handling reflect this. Adapt when running locally.
- No auth middleware — routes trust userId from request body. Auth is honor-system.
- Creating a listing auto-promotes user role from "customer" to "host".
- The app uses React Native New Architecture (`newArchEnabled: true`) and React Compiler (`reactCompiler: true`).
- Categories are a database table (not an enum) so new categories can be added without migrations.
- Events table is append-only for ML/LLM training data collection.
- AI conversation tables (conversations, conversation_messages) are ready for LLM chat integration.
- Listing embeddings use pgvector for semantic search — regenerate when title/description changes.
