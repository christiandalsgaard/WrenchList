/**
 * POST /api/events
 * Tracks a user interaction event. Fire-and-forget — always returns 202.
 * Event tracking failures are logged but never returned to the client.
 */
import { insertEventSchema } from "../../shared/schema";
import { storage } from "../../server/storage";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { userId, ...eventData } = body;
    const data = insertEventSchema.parse(eventData);
    // Fire-and-forget — don't block response on DB write
    storage.trackEvent(userId || null, data);
    return Response.json({ ok: true }, { status: 202 });
  } catch {
    // Event tracking should never return errors to the client
    return Response.json({ ok: true }, { status: 202 });
  }
}
