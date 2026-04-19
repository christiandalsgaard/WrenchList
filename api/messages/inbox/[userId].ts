/**
 * GET /api/messages/inbox/:userId
 * Returns conversation previews for a user's inbox — last message from
 * each conversation partner plus unread count.
 */
import { storage } from "../../../server/storage";

export async function GET(
  _request: Request,
  context: { params: { userId: string } }
): Promise<Response> {
  try {
    const { userId } = context.params;
    const previews = await storage.getConversationPreviews(userId);
    return Response.json({ conversations: previews });
  } catch (error) {
    console.error("Get inbox error:", error);
    return Response.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}
