/**
 * Catch-all handler for /api/conversations/*
 * Consolidates AI conversation routes into one Vercel Function.
 *
 * Routes handled:
 *   POST  /api/conversations                    — Create conversation
 *   POST  /api/conversations/:id/messages        — Add message
 *   GET   /api/conversations/:id/messages        — Get messages
 */
import { storage } from "../../server/storage";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.replace(/^\/api\/conversations\/?/, "").split("/").filter(Boolean);

    // GET /api/conversations/:id/messages
    if (segments.length === 2 && segments[1] === "messages") {
      const messages = await storage.getConversationMessages(segments[0]);
      return Response.json({ messages });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Get conversation messages error:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.replace(/^\/api\/conversations\/?/, "").split("/").filter(Boolean);
    const body = await request.json();

    // POST /api/conversations/:id/messages — add message to conversation
    if (segments.length === 2 && segments[1] === "messages") {
      const { role, content, metadata, tokenCount } = body;
      if (!role || !content) {
        return Response.json({ error: "role and content are required" }, { status: 400 });
      }
      await storage.addConversationMessage(segments[0], role, content, metadata, tokenCount);
      return Response.json({ ok: true }, { status: 201 });
    }

    // POST /api/conversations — create new conversation
    const { userId, context } = body;
    if (!userId) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    const conversation = await storage.createConversation(userId, context);
    return Response.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Conversation error:", error);
    return Response.json({ error: "Failed to process conversation request" }, { status: 500 });
  }
}
