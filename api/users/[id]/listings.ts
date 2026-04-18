/**
 * GET /api/users/:id/listings
 * Returns all listings belonging to a specific host user (paginated).
 */
import { storage } from "../../../server/storage";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const cursorId = url.searchParams.get("cursorId") ?? undefined;
    const limitStr = url.searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const result = await storage.getListingsByHost(id, { cursor, cursorId, limit });
    return Response.json(result);
  } catch (error) {
    console.error("Get user listings error:", error);
    return Response.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
