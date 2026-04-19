/**
 * GET /api/messages/:userId/:otherUserId
 * Returns the paginated message thread between two users.
 * Includes messages sent in both directions, newest first.
 */
import { storage } from "../../../server/storage";

export async function GET(
  request: Request,
  context: { params: { userId: string; otherUserId: string } }
): Promise<Response> {
  try {
    const { userId, otherUserId } = context.params;
    const url = new URL(request.url);

    // Extract cursor-based pagination params
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const cursorId = url.searchParams.get("cursorId") ?? undefined;
    const limitStr = url.searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const result = await storage.getMessageThread(userId, otherUserId, { cursor, cursorId, limit });
    return Response.json(result);
  } catch (error) {
    console.error("Get message thread error:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
