/**
 * PATCH /api/bookings/:id/status
 * Updates a booking's status (e.g. confirmed, cancelled, completed).
 * Validates status against the booking_status enum.
 */
import { storage } from "../../../server/storage";

// Valid booking statuses — must match bookingStatusEnum in schema
const VALID_STATUSES = ["pending", "confirmed", "active", "completed", "cancelled", "disputed"];

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
): Promise<Response> {
  try {
    const { id } = context.params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return Response.json({ error: "Status is required" }, { status: 400 });
    }

    // Validate status against allowed values
    if (!VALID_STATUSES.includes(status)) {
      return Response.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const booking = await storage.updateBookingStatus(id, status);
    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }
    return Response.json({ booking });
  } catch (error) {
    console.error("Update booking status error:", error);
    return Response.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
