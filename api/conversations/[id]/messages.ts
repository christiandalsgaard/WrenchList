/**
 * GET /api/conversations/:id/messages — fetch all messages in a conversation.
 * POST /api/conversations/:id/messages — add a message to a conversation.
 *
 * Used by the AI chat feature to persist conversation history.
 * Messages include role (user/assistant/system), content, and optional
 * metadata (tool calls, model info, token counts).
 */
import { storage } from "../../../server/storage";

export async function GET(
  _request: Request,
  context: { params: { id: string } }
): Promise<Response> {
  try {
    const { id } = context.params;
    const messages = await storage.getConversationMessages(id);
    return Response.json({ messages });
  } catch (error) {
    console.error("Get conversation messages error:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: { id: string } }
): Promise<Response> {
  try {
    const { id } = context.params;
    const body = await request.json();
    const { role, content, metadata, tokenCount } = body;

    if (!role || !content) {
      return Response.json({ error: "role and content are required" }, { status: 400 });
    }

    await storage.addConversationMessage(id, role, content, metadata, tokenCount);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Add conversation message error:", error);
    return Response.json({ error: "Failed to add message" }, { status: 500 });
  }
}
