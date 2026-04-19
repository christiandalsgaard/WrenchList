/**
 * Catch-all handler for /api/messages/*
 * Consolidates all message routes into one Vercel Function.
 *
 * Routes handled:
 *   POST  /api/messages                         — Send message
 *   GET   /api/messages/inbox/:userId            — Inbox previews
 *   GET   /api/messages/:userId/:otherUserId     — Message thread
 */
import { insertMessageSchema } from "../../shared/schema";
import { storage } from "../../server/storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

function getPagination(url: URL) {
  return {
    cursor: url.searchParams.get("cursor") ?? undefined,
    cursorId: url.searchParams.get("cursorId") ?? undefined,
    limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : undefined,
  };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.replace(/^\/api\/messages\/?/, "").split("/").filter(Boolean);

    // GET /api/messages/inbox/:userId
    if (segments[0] === "inbox" && segments[1]) {
      const previews = await storage.getConversationPreviews(segments[1]);
      return Response.json({ conversations: previews });
    }

    // GET /api/messages/:userId/:otherUserId
    if (segments.length === 2) {
      const result = await storage.getMessageThread(segments[0], segments[1], getPagination(url));
      return Response.json(result);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Get messages error:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { senderId, ...messageData } = body;

    if (!senderId) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const data = insertMessageSchema.parse(messageData);
    const message = await storage.sendMessage(senderId, data);
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: fromZodError(error).message }, { status: 400 });
    }
    console.error("Send message error:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
