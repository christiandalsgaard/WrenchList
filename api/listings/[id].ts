/**
 * GET /api/listings/:id
 * Returns a single listing by its UUID, including images and rating summary.
 */
import { storage } from "../../server/storage";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await context.params;
    const listing = await storage.getListing(id);

    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    return Response.json({ listing });
  } catch (error) {
    console.error("Get listing error:", error);
    return Response.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}
