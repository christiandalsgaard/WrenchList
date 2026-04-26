/**
 * Catch-all handler for /api/users/*
 * Consolidates all user-related routes into one Vercel Function.
 *
 * Routes handled:
 *   GET    /api/users/:id                              — Get user profile
 *   PATCH  /api/users/:id                              — Update user profile
 *   GET    /api/users/:id/listings                     — Host's listings
 *   GET    /api/users/:id/bookings                     — Enriched bookings (customer)
 *   GET    /api/users/:id/host-bookings                — Enriched bookings (host)
 *   GET    /api/users/:id/saved-listings               — Saved/favorited listings
 *   POST   /api/users/:id/saved-listings               — Save a listing
 *   DELETE /api/users/:id/saved-listings/:listingId    — Unsave a listing
 *   GET    /api/users/:id/saved-listings/count         — Saved count for badge
 *   GET    /api/users/:id/notification-preferences     — Get notification prefs
 *   PUT    /api/users/:id/notification-preferences     — Upsert notification prefs
 */
import { updateUserSchema, updateNotificationPreferencesSchema } from "../../shared/schema";
import { storage } from "../../server/storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper to extract pagination params from URL search params
function getPagination(url: URL) {
  return {
    cursor: url.searchParams.get("cursor") ?? undefined,
    cursorId: url.searchParams.get("cursorId") ?? undefined,
    limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : undefined,
  };
}

// Parse path segments after /api/users/
function parseSegments(url: URL): string[] {
  return url.pathname.replace(/^\/api\/users\/?/, "").split("/").filter(Boolean);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = parseSegments(url);
    const userId = segments[0];

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // GET /api/users/:id/listings — host's listings
    if (segments[1] === "listings") {
      const result = await storage.getListingsByHost(userId, getPagination(url));
      return Response.json(result);
    }

    // GET /api/users/:id/bookings — enriched bookings as customer
    if (segments[1] === "bookings") {
      const result = await storage.getEnrichedBookingsByCustomer(userId, getPagination(url));
      return Response.json(result);
    }

    // GET /api/users/:id/host-bookings — enriched bookings as host
    if (segments[1] === "host-bookings") {
      const result = await storage.getEnrichedBookingsByHost(userId, getPagination(url));
      return Response.json(result);
    }

    // GET /api/users/:id/saved-listings/count — badge count
    if (segments[1] === "saved-listings" && segments[2] === "count") {
      const count = await storage.getSavedListingCount(userId);
      return Response.json({ count });
    }

    // GET /api/users/:id/saved-listings — list saved listings
    if (segments[1] === "saved-listings") {
      const result = await storage.getSavedListings(userId, getPagination(url));
      return Response.json(result);
    }

    // GET /api/users/:id/notification-preferences
    if (segments[1] === "notification-preferences") {
      const prefs = await storage.getNotificationPreferences(userId);
      // Return defaults if no preferences row exists yet
      return Response.json({
        preferences: prefs || { bookingUpdates: true, messages: true, promotions: false },
      });
    }

    // GET /api/users/:id — user profile
    if (segments.length === 1) {
      const user = await storage.getUser(userId);
      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }
      // Strip sensitive fields
      const { passwordHash, deletedAt, ...safeUser } = user;
      return Response.json({ user: safeUser });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("User GET error:", error);
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = parseSegments(url);
    const userId = segments[0];

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // POST /api/users/:id/saved-listings — save a listing
    if (segments[1] === "saved-listings") {
      const body = await request.json();
      const { listingId } = body;

      if (!listingId) {
        return Response.json({ error: "listingId is required" }, { status: 400 });
      }

      // Verify the listing exists
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return Response.json({ error: "Listing not found" }, { status: 404 });
      }

      await storage.saveListing(userId, listingId);
      return Response.json({ ok: true }, { status: 201 });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("User POST error:", error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = parseSegments(url);
    const userId = segments[0];

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // PATCH /api/users/:id — update user profile
    if (segments.length === 1) {
      const body = await request.json();
      const data = updateUserSchema.parse(body);
      const user = await storage.updateUser(userId, data);

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      const { passwordHash, deletedAt, ...safeUser } = user;
      return Response.json({ user: safeUser });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: fromZodError(error).message }, { status: 400 });
    }
    console.error("User PATCH error:", error);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = parseSegments(url);
    const userId = segments[0];

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // PUT /api/users/:id/notification-preferences
    if (segments[1] === "notification-preferences") {
      const body = await request.json();
      const data = updateNotificationPreferencesSchema.parse(body);
      const prefs = await storage.upsertNotificationPreferences(userId, data);
      return Response.json({ preferences: prefs });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: fromZodError(error).message }, { status: 400 });
    }
    console.error("User PUT error:", error);
    return Response.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = parseSegments(url);
    const userId = segments[0];

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // DELETE /api/users/:id/saved-listings/:listingId
    if (segments[1] === "saved-listings" && segments[2]) {
      await storage.unsaveListing(userId, segments[2]);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("User DELETE error:", error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}
