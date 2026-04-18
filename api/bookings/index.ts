/**
 * POST /api/bookings
 * Creates a new booking request. Requires customerId in body.
 */
import { insertBookingSchema } from "../../shared/schema";
import { storage } from "../../server/storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { customerId, ...bookingData } = body;

    if (!customerId) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const data = insertBookingSchema.parse(bookingData);
    const booking = await storage.createBooking(customerId, data);
    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: fromZodError(error).message }, { status: 400 });
    }
    console.error("Create booking error:", error);
    return Response.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
