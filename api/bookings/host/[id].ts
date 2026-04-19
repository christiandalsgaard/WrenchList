/**
 * GET /api/bookings/host/:id
 * Returns paginated bookings for a host (the tool owner).
 */
import { storage } from "../../../server/storage";

export async function GET(
  request: Request,
  context: { params: { id: string } }
): Promise<Response> {
  try {
    const { id } = context.params;
    const url = new URL(request.url);

    // Extract cursor-based pagination params from query string
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const cursorId = url.searchParams.get("cursorId") ?? undefined;
    const limitStr = url.searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const result = await storage.getBookingsByHost(id, { cursor, cursorId, limit });
    return Response.json(result);
  } catch (error) {
    console.error("Get host bookings error:", error);
    return Response.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
