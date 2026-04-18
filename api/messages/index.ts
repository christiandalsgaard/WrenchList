/**
 * POST /api/messages
 * Sends a user-to-user message. Requires senderId in body.
 */
import { insertMessageSchema } from "../../shared/schema";
import { storage } from "../../server/storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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
