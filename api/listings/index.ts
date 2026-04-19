/**
 * GET /api/listings — paginated listing query with optional category/city filters.
 * POST /api/listings — creates a new listing (requires hostId in body).
 *   Auto-promotes user role to "host" if currently "customer".
 */
import { insertListingSchema } from "../../shared/schema";
import { storage } from "../../server/storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get("categoryId") ?? undefined;
    const city = url.searchParams.get("city") ?? undefined;
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const cursorId = url.searchParams.get("cursorId") ?? undefined;
    const limitStr = url.searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const result = await storage.getListings({ categoryId, city, cursor, cursorId, limit });
    return Response.json(result);
  } catch (error) {
    console.error("Get listings error:", error);
    return Response.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { hostId, ...listingData } = body;

    if (!hostId) {
      return Response.json({ error: "Authentication required. Please sign in." }, { status: 401 });
    }

    // Verify host exists
    const host = await storage.getUser(hostId);
    if (!host) {
      return Response.json({ error: "User not found. Please sign in again." }, { status: 404 });
    }

    // Auto-promote to host role if needed
    if (host.role !== "host") {
      await storage.updateUserRole(hostId, "host");
    }

    // If categoryId looks like a slug (not a UUID), resolve it to the actual UUID.
    // This lets the frontend send "workshop" / "equipment" / "tools" directly.
    if (listingData.categoryId && !listingData.categoryId.includes("-")) {
      const cats = await storage.getCategories();
      const match = cats.find((c: { slug: string }) => c.slug === listingData.categoryId);
      if (match) {
        listingData.categoryId = match.id;
      }
    }

    const data = insertListingSchema.parse(listingData);
    const listing = await storage.createListing(hostId, data);
    return Response.json({ listing }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: fromZodError(error).message }, { status: 400 });
    }
    console.error("Create listing error:", error);
    return Response.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
