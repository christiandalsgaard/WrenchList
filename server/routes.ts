/**
 * Express API Route Registration
 *
 * Registers all REST API routes on the Express app for local development.
 * These same operations are also exposed as Vercel Functions in api/.
 *
 * Routes:
 *   POST   /api/auth/signup          — Create account
 *   POST   /api/auth/signin          — Sign in
 *   GET    /api/categories            — List all categories
 *   GET    /api/listings              — List listings (paginated, filterable)
 *   POST   /api/listings              — Create listing
 *   GET    /api/listings/:id          — Get listing detail
 *   GET    /api/users/:id/listings    — Get user's listings
 *   POST   /api/bookings              — Create booking
 *   GET    /api/bookings/customer/:id — Customer's bookings
 *   GET    /api/bookings/host/:id     — Host's bookings
 *   PATCH  /api/bookings/:id/status   — Update booking status
 *   POST   /api/reviews               — Create review
 *   GET    /api/reviews/listing/:id   — Reviews for a listing
 *   POST   /api/messages              — Send message
 *   GET    /api/messages/:userId/:otherUserId — Message thread
 *   GET    /api/messages/inbox/:userId — Conversation previews
 *   POST   /api/events                — Track event
 */
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import {
  insertUserSchema,
  loginSchema,
  insertListingSchema,
  insertBookingSchema,
  insertReviewSchema,
  insertMessageSchema,
  insertEventSchema,
  updateUserSchema,
  updateNotificationPreferencesSchema,
} from "../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { rateLimit } from "./rate-limit";

/**
 * Helper to extract pagination params from query string.
 * Cursor-based: pass ?cursor=<ISO timestamp>&cursorId=<id>&limit=<n>
 */
function getPaginationParams(query: Record<string, unknown>) {
  return {
    cursor: typeof query.cursor === "string" ? query.cursor : undefined,
    cursorId: typeof query.cursorId === "string" ? query.cursorId : undefined,
    limit: typeof query.limit === "string" ? parseInt(query.limit, 10) : undefined,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ---- Rate Limiting -------------------------------------------------------
  // Auth endpoints get stricter limits (5 per minute) to prevent brute force.
  // General API endpoints get standard limits (30 per minute per IP).
  const authLimiter = rateLimit(5, 60000);
  const generalLimiter = rateLimit(30, 60000);

  // Apply general rate limiting to all API routes
  app.use("/api/", generalLimiter);

  // ---- Auth ----------------------------------------------------------------

  app.post("/api/auth/signup", authLimiter, async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = await storage.createUser(data);
      const { passwordHash, deletedAt, ...safeUser } = user;
      return res.status(201).json({ user: safeUser });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Signup error:", error);
      return res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/signin", authLimiter, async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.verifyPassword(data.email, data.password);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const { passwordHash, deletedAt, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Signin error:", error);
      return res.status(500).json({ error: "Failed to sign in" });
    }
  });

  // ---- Categories ----------------------------------------------------------

  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const cats = await storage.getCategories();
      return res.json({ categories: cats });
    } catch (error) {
      console.error("Get categories error:", error);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // ---- Listings ------------------------------------------------------------

  app.post("/api/listings", async (req: Request, res: Response) => {
    try {
      const { hostId, ...listingData } = req.body;

      if (!hostId) {
        return res.status(401).json({ error: "Authentication required. Please sign in." });
      }

      const host = await storage.getUser(hostId);
      if (!host) {
        return res.status(404).json({ error: "User not found. Please sign in again." });
      }

      // Auto-promote to host role when creating a listing
      if (host.role !== "host") {
        await storage.updateUserRole(hostId, "host");
      }

      // If categoryId looks like a slug (not a UUID), resolve it to the actual UUID.
      // This lets the frontend send "workshop" / "equipment" / "tools" directly.
      if (listingData.categoryId && !listingData.categoryId.includes("-")) {
        const cats = await storage.getCategories();
        const match = cats.find((c: { slug: string }) => c.slug === listingData.categoryId);
        if (match) {
          listingData.categoryId = match.id;
        }
      }

      const data = insertListingSchema.parse(listingData);
      const listing = await storage.createListing(hostId, data);
      return res.status(201).json({ listing });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Create listing error:", error);
      return res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.get("/api/listings", async (req: Request, res: Response) => {
    try {
      const { categoryId, city, ...paginationQuery } = req.query as Record<string, string>;
      const pagination = getPaginationParams(paginationQuery);

      const result = await storage.getListings({
        ...pagination,
        categoryId: categoryId || undefined,
        city: city || undefined,
      });

      return res.json(result);
    } catch (error) {
      console.error("Get listings error:", error);
      return res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/:id", async (req: Request, res: Response) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      return res.json({ listing });
    } catch (error) {
      console.error("Get listing error:", error);
      return res.status(500).json({ error: "Failed to fetch listing" });
    }
  });

  app.get("/api/users/:id/listings", async (req: Request, res: Response) => {
    try {
      const pagination = getPaginationParams(req.query as Record<string, string>);
      const result = await storage.getListingsByHost(req.params.id, pagination);
      return res.json(result);
    } catch (error) {
      console.error("Get user listings error:", error);
      return res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  // ---- User Profile --------------------------------------------------------

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { passwordHash, deletedAt, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const data = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(req.params.id, data);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { passwordHash, deletedAt, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ error: fromZodError(error).message });
      console.error("Update user error:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ---- Enriched Bookings ---------------------------------------------------

  app.get("/api/users/:id/bookings", async (req: Request, res: Response) => {
    try {
      const pagination = getPaginationParams(req.query as Record<string, string>);
      const result = await storage.getEnrichedBookingsByCustomer(req.params.id, pagination);
      return res.json(result);
    } catch (error) {
      console.error("Get enriched bookings error:", error);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/users/:id/host-bookings", async (req: Request, res: Response) => {
    try {
      const pagination = getPaginationParams(req.query as Record<string, string>);
      const result = await storage.getEnrichedBookingsByHost(req.params.id, pagination);
      return res.json(result);
    } catch (error) {
      console.error("Get host bookings error:", error);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // ---- Saved Listings ------------------------------------------------------

  app.get("/api/users/:id/saved-listings/count", async (req: Request, res: Response) => {
    try {
      const count = await storage.getSavedListingCount(req.params.id);
      return res.json({ count });
    } catch (error) {
      console.error("Get saved count error:", error);
      return res.status(500).json({ error: "Failed to get count" });
    }
  });

  app.get("/api/users/:id/saved-listings", async (req: Request, res: Response) => {
    try {
      const pagination = getPaginationParams(req.query as Record<string, string>);
      const result = await storage.getSavedListings(req.params.id, pagination);
      return res.json(result);
    } catch (error) {
      console.error("Get saved listings error:", error);
      return res.status(500).json({ error: "Failed to fetch saved listings" });
    }
  });

  app.post("/api/users/:id/saved-listings", async (req: Request, res: Response) => {
    try {
      const { listingId } = req.body;
      if (!listingId) return res.status(400).json({ error: "listingId is required" });
      const listing = await storage.getListing(listingId);
      if (!listing) return res.status(404).json({ error: "Listing not found" });
      await storage.saveListing(req.params.id, listingId);
      return res.status(201).json({ ok: true });
    } catch (error) {
      console.error("Save listing error:", error);
      return res.status(500).json({ error: "Failed to save listing" });
    }
  });

  app.delete("/api/users/:id/saved-listings/:listingId", async (req: Request, res: Response) => {
    try {
      await storage.unsaveListing(req.params.id, req.params.listingId);
      return res.json({ ok: true });
    } catch (error) {
      console.error("Unsave listing error:", error);
      return res.status(500).json({ error: "Failed to unsave listing" });
    }
  });

  // ---- Notification Preferences --------------------------------------------

  app.get("/api/users/:id/notification-preferences", async (req: Request, res: Response) => {
    try {
      const prefs = await storage.getNotificationPreferences(req.params.id);
      return res.json({ preferences: prefs || { bookingUpdates: true, messages: true, promotions: false } });
    } catch (error) {
      console.error("Get notification prefs error:", error);
      return res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.put("/api/users/:id/notification-preferences", async (req: Request, res: Response) => {
    try {
      const data = updateNotificationPreferencesSchema.parse(req.body);
      const prefs = await storage.upsertNotificationPreferences(req.params.id, data);
      return res.json({ preferences: prefs });
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ error: fromZodError(error).message });
      console.error("Update notification prefs error:", error);
      return res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // ---- Bookings ------------------------------------------------------------

  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      const { customerId, ...bookingData } = req.body;
      if (!customerId) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const data = insertBookingSchema.parse(bookingData);
      const booking = await storage.createBooking(customerId, data);
      return res.status(201).json({ booking });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      // Handle overlapping booking conflict
      if (error instanceof Error && error.message === "BOOKING_OVERLAP") {
        return res.status(409).json({ error: "This listing is already booked for the selected dates" });
      }
      console.error("Create booking error:", error);
      return res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.get("/api/bookings/customer/:id", async (req: Request, res: Response) => {
    try {
      const pagination = getPaginationParams(req.query as Record<string, string>);
      const result = await storage.getBookingsByCustomer(req.params.id, pagination);
      return res.json(result);
    } catch (error) {
      console.error("Get customer bookings error:", error);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/host/:id", async (req: Request, res: Response) => {
    try {
      const pagination = getPaginationParams(req.query as Record<string, string>);
      const result = await storage.getBookingsByHost(req.params.id, pagination);
      return res.json(result);
    } catch (error) {
      console.error("Get host bookings error:", error);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // Validate status against the booking_status enum
      const validStatuses = ["pending", "confirmed", "active", "completed", "cancelled", "disputed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }

      const booking = await storage.updateBookingStatus(req.params.id, status);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      return res.json({ booking });
    } catch (error) {
      console.error("Update booking status error:", error);
      return res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // ---- Reviews -------------------------------------------------------------

  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const { reviewerId, ...reviewData } = req.body;
      if (!reviewerId) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const data = insertReviewSchema.parse(reviewData);
      const review = await storage.createReview(reviewerId, data);
      return res.status(201).json({ review });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Create review error:", error);
      return res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/reviews/listing/:id", async (req: Request, res: Response) => {
    try {
      const pagination = getPaginationParams(req.query as Record<string, string>);
      const result = await storage.getReviewsByListing(req.params.id, pagination);
      const rating = await storage.getAverageRating(req.params.id);
      return res.json({ ...result, averageRating: rating.avg, totalReviews: rating.count });
    } catch (error) {
      console.error("Get reviews error:", error);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // ---- Messages ------------------------------------------------------------

  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const { senderId, ...messageData } = req.body;
      if (!senderId) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const data = insertMessageSchema.parse(messageData);
      const message = await storage.sendMessage(senderId, data);
      return res.status(201).json({ message });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Send message error:", error);
      return res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/messages/:userId/:otherUserId", async (req: Request, res: Response) => {
    try {
      const pagination = getPaginationParams(req.query as Record<string, string>);
      const result = await storage.getMessageThread(
        req.params.userId,
        req.params.otherUserId,
        pagination
      );
      return res.json(result);
    } catch (error) {
      console.error("Get message thread error:", error);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/inbox/:userId", async (req: Request, res: Response) => {
    try {
      const previews = await storage.getConversationPreviews(req.params.userId);
      return res.json({ conversations: previews });
    } catch (error) {
      console.error("Get inbox error:", error);
      return res.status(500).json({ error: "Failed to fetch inbox" });
    }
  });

  // ---- Semantic Search ------------------------------------------------------

  app.post("/api/search", async (req: Request, res: Response) => {
    try {
      const { embedding, limit, categoryId, city } = req.body;

      if (!embedding || !Array.isArray(embedding)) {
        return res.status(400).json({ error: "embedding array is required" });
      }

      // Validate embedding dimensions (1536 for text-embedding-3-small)
      if (embedding.length !== 1536) {
        return res.status(400).json({ error: `Expected 1536-dimension embedding, got ${embedding.length}` });
      }

      const results = await storage.searchListingsByEmbedding(
        embedding,
        Math.min(limit || 10, 50), // Cap at 50 results
        categoryId,
        city
      );

      return res.json({ results });
    } catch (error) {
      console.error("Search error:", error);
      return res.status(500).json({ error: "Search failed" });
    }
  });

  // ---- Events --------------------------------------------------------------

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const { userId, ...eventData } = req.body;
      const data = insertEventSchema.parse(eventData);
      // Fire-and-forget — don't block on event tracking
      storage.trackEvent(userId || null, data);
      return res.status(202).json({ ok: true });
    } catch (error) {
      // Event tracking should never return errors to the client
      return res.status(202).json({ ok: true });
    }
  });

  // ---- AI Conversations ----------------------------------------------------

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { userId, context } = req.body;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const conversation = await storage.createConversation(userId, context);
      return res.status(201).json({ conversation });
    } catch (error) {
      console.error("Create conversation error:", error);
      return res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const { role, content, metadata, tokenCount } = req.body;
      if (!role || !content) {
        return res.status(400).json({ error: "role and content are required" });
      }

      await storage.addConversationMessage(req.params.id, role, content, metadata, tokenCount);
      return res.status(201).json({ ok: true });
    } catch (error) {
      console.error("Add conversation message error:", error);
      return res.status(500).json({ error: "Failed to add message" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getConversationMessages(req.params.id);
      return res.json({ messages });
    } catch (error) {
      console.error("Get conversation messages error:", error);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
