/**
 * Catch-all handler for /api/bookings/*
 * Consolidates all booking routes into one Vercel Function to stay within
 * the Hobby plan's 12-function limit.
 *
 * Routes handled:
 *   POST   /api/bookings               — Create booking
 *   GET    /api/bookings/customer/:id   — Customer's bookings
 *   GET    /api/bookings/host/:id       — Host's bookings
 *   PATCH  /api/bookings/:id/status     — Update booking status
 */
import { insertBookingSchema } from "../../shared/schema";
import { storage } from "../../server/storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Valid booking statuses — must match bookingStatusEnum in schema
const VALID_STATUSES = ["pending", "confirmed", "active", "completed", "cancelled", "disputed"];

/**
 * Parse pagination params from URL search params.
 */
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
    // Extract path segments after /api/bookings/
    const segments = url.pathname.replace(/^\/api\/bookings\/?/, "").split("/").filter(Boolean);

    // GET /api/bookings/customer/:id
    if (segments[0] === "customer" && segments[1]) {
      const result = await storage.getBookingsByCustomer(segments[1], getPagination(url));
      return Response.json(result);
    }

    // GET /api/bookings/host/:id
    if (segments[0] === "host" && segments[1]) {
      const result = await storage.getBookingsByHost(segments[1], getPagination(url));
      return Response.json(result);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Get bookings error:", error);
    return Response.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

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
    if (error instanceof Error && error.message === "BOOKING_OVERLAP") {
      return Response.json({ error: "This listing is already booked for the selected dates" }, { status: 409 });
    }
    console.error("Create booking error:", error);
    return Response.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    // PATCH /api/bookings/:id/status
    const segments = url.pathname.replace(/^\/api\/bookings\/?/, "").split("/").filter(Boolean);

    if (segments.length === 2 && segments[1] === "status") {
      const id = segments[0];
      const body = await request.json();
      const { status } = body;

      if (!status) {
        return Response.json({ error: "Status is required" }, { status: 400 });
      }
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
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Update booking status error:", error);
    return Response.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
