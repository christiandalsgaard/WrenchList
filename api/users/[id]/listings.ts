/**
 * GET /api/users/:id/listings
 * Returns all listings belonging to a specific host user.
 */
import { storage } from "../../../server/storage";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await context.params;
    const listings = await storage.getListingsByHost(id);
    return Response.json({ listings });
  } catch (error) {
    console.error("Get user listings error:", error);
    return Response.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
