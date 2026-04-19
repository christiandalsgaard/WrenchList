/**
 * POST /api/conversations
 * Creates a new AI conversation session for a user.
 * Optionally accepts context about what the user was doing (screen, search query, etc.)
 * to help the AI assistant provide relevant responses.
 */
import { storage } from "../../server/storage";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { userId, context } = body;

    if (!userId) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const conversation = await storage.createConversation(userId, context);
    return Response.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Create conversation error:", error);
    return Response.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
