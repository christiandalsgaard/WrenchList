/**
 * WrenchList Storage Layer
 *
 * Database access via Drizzle ORM over Postgres. Provides CRUD operations
 * for all tables: users, categories, listings, bookings, reviews, messages,
 * conversations, and events.
 *
 * Key design decisions:
 * - IStorage interface defines the contract so we can swap implementations
 *   (e.g. in-memory for tests).
 * - Cursor-based pagination on all list queries — scales to millions of rows
 *   without the performance cliff of OFFSET pagination.
 * - Soft deletes on users/listings — queries filter out deleted records by default.
 * - Connection pooling via pg.Pool — for serverless (Vercel Functions), consider
 *   replacing with @neondatabase/serverless or a PgBouncer-backed URL.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, lt, gt, isNull, or, sql, asc } from "drizzle-orm";
import pg from "pg";
import {
  users,
  categories,
  listings,
  listingImages,
  listingEmbeddings,
  bookings,
  reviews,
  messages,
  conversations,
  conversationMessages,
  events,
  type User,
  type InsertUser,
  type UpdateUser,
  type Listing,
  type InsertListing,
  type Category,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview,
  type Message,
  type InsertMessage,
  type InsertEvent,
} from "../shared/schema";
import { hash, compare } from "bcrypt";

// ---------------------------------------------------------------------------
// Database Connection
// ---------------------------------------------------------------------------

/**
 * Connection pool for Postgres. In serverless environments (Vercel Functions),
 * each function invocation may reuse or create a new pool. Keep max connections
 * low to avoid exhausting the database connection limit.
 *
 * For production at scale, replace with:
 * - Neon serverless driver (@neondatabase/serverless) for HTTP-based queries
 * - PgBouncer connection pooling URL for persistent pool reuse
 */
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Max connections per pool — keep low for serverless
});

export const db = drizzle(pool);

const SALT_ROUNDS = 10;

// Default page size for paginated queries
const DEFAULT_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Pagination Types
// ---------------------------------------------------------------------------

/** Cursor-based pagination params — pass the last item's createdAt + id as cursor */
export interface PaginationParams {
  cursor?: string;  // ISO timestamp of last item's createdAt
  cursorId?: string; // ID of last item (tiebreaker for same-timestamp rows)
  limit?: number;
}

/** Paginated response wrapper */
export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;  // null means no more pages
  nextCursorId: string | null;
}

// ---------------------------------------------------------------------------
// Storage Interface
// ---------------------------------------------------------------------------

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: UpdateUser): Promise<User | undefined>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  updateUserRole(userId: string, role: "customer" | "host" | "admin"): Promise<void>;
  softDeleteUser(id: string): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(data: {
    slug: string;
    name: string;
    description?: string;
    parentId?: string;
    iconName?: string;
    sortOrder?: number;
  }): Promise<Category>;

  // Listings
  createListing(hostId: string, listing: InsertListing): Promise<Listing>;
  getListing(id: string): Promise<Listing | undefined>;
  getListings(params?: PaginationParams & { categoryId?: string; city?: string }): Promise<PaginatedResult<Listing>>;
  getListingsByHost(hostId: string, params?: PaginationParams): Promise<PaginatedResult<Listing>>;
  updateListing(id: string, data: Partial<InsertListing>): Promise<Listing | undefined>;
  softDeleteListing(id: string): Promise<void>;

  // Listing Images
  addListingImage(listingId: string, url: string, altText?: string, sortOrder?: number): Promise<void>;
  getListingImages(listingId: string): Promise<{ id: string; url: string; altText: string | null; sortOrder: number }[]>;

  // Embeddings
  upsertListingEmbedding(listingId: string, embedding: number[], model: string, sourceText: string): Promise<void>;

  // Bookings
  createBooking(customerId: string, data: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByCustomer(customerId: string, params?: PaginationParams): Promise<PaginatedResult<Booking>>;
  getBookingsByHost(hostId: string, params?: PaginationParams): Promise<PaginatedResult<Booking>>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;

  // Reviews
  createReview(reviewerId: string, data: InsertReview): Promise<Review>;
  getReviewsByListing(listingId: string, params?: PaginationParams): Promise<PaginatedResult<Review>>;
  getAverageRating(listingId: string): Promise<{ avg: number; count: number }>;

  // Messages
  sendMessage(senderId: string, data: InsertMessage): Promise<Message>;
  getMessageThread(userId: string, otherUserId: string, params?: PaginationParams): Promise<PaginatedResult<Message>>;
  getConversationPreviews(userId: string): Promise<{ otherUserId: string; lastMessage: string; lastAt: Date; unreadCount: number }[]>;
  markMessagesRead(userId: string, senderId: string): Promise<void>;

  // Events
  trackEvent(userId: string | null, data: InsertEvent): Promise<void>;

  // AI Conversations
  createConversation(userId: string, context?: Record<string, unknown>): Promise<{ id: string }>;
  addConversationMessage(conversationId: string, role: string, content: string, metadata?: Record<string, unknown>, tokenCount?: number): Promise<void>;
  getConversationMessages(conversationId: string): Promise<{ role: string; content: string; metadata: Record<string, unknown>; createdAt: Date }[]>;
}

// ---------------------------------------------------------------------------
// Database Implementation
// ---------------------------------------------------------------------------

export class DatabaseStorage implements IStorage {
  // ---- Users ---------------------------------------------------------------

  async getUser(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password before storing — bcrypt with 10 salt rounds
    const passwordHash = await hash(insertUser.password, SALT_ROUNDS);
    const result = await db
      .insert(users)
      .values({
        email: insertUser.email,
        displayName: insertUser.displayName,
        phone: insertUser.phone || null,
        address: insertUser.address || null,
        city: insertUser.city || null,
        state: insertUser.state || null,
        zipCode: insertUser.zipCode || null,
        bio: insertUser.bio || null,
        role: insertUser.role || "customer",
        passwordHash,
      })
      .returning();
    return result[0];
  }

  async updateUser(id: string, data: UpdateUser): Promise<User | undefined> {
    // Only set fields that were actually provided (not undefined)
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.locationLat !== undefined) updateData.locationLat = String(data.locationLat);
    if (data.locationLng !== undefined) updateData.locationLng = String(data.locationLng);

    const result = await db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();
    return result[0];
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const valid = await compare(password, user.passwordHash);
    return valid ? user : null;
  }

  async updateUserRole(userId: string, role: "customer" | "host" | "admin"): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async softDeleteUser(id: string): Promise<void> {
    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, id));
  }

  // ---- Categories ----------------------------------------------------------

  async getCategories(): Promise<Category[]> {
    return db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    return result[0];
  }

  async createCategory(data: {
    slug: string;
    name: string;
    description?: string;
    parentId?: string;
    iconName?: string;
    sortOrder?: number;
  }): Promise<Category> {
    const result = await db
      .insert(categories)
      .values({
        slug: data.slug,
        name: data.name,
        description: data.description || null,
        parentId: data.parentId || null,
        iconName: data.iconName || null,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();
    return result[0];
  }

  // ---- Listings ------------------------------------------------------------

  async createListing(hostId: string, listing: InsertListing): Promise<Listing> {
    const result = await db
      .insert(listings)
      .values({
        hostId,
        categoryId: listing.categoryId,
        title: listing.title,
        description: listing.description,
        city: listing.city,
        state: listing.state || null,
        relativeLocation: listing.relativeLocation || null,
        latitude: listing.latitude != null ? String(listing.latitude) : null,
        longitude: listing.longitude != null ? String(listing.longitude) : null,
        priceHourlyCents: listing.priceHourlyCents || null,
        priceDailyCents: listing.priceDailyCents || null,
        priceWeeklyCents: listing.priceWeeklyCents || null,
        specs: listing.specs || {},
        safetyRequirements: listing.safetyRequirements || null,
        status: listing.status || "active",
      })
      .returning();
    return result[0];
  }

  async getListing(id: string): Promise<Listing | undefined> {
    const result = await db
      .select()
      .from(listings)
      .where(and(eq(listings.id, id), isNull(listings.deletedAt)));
    return result[0];
  }

  /**
   * Paginated listing query with optional category and city filters.
   * Uses cursor-based pagination (createdAt + id) for stable, efficient paging.
   */
  async getListings(
    params?: PaginationParams & { categoryId?: string; city?: string }
  ): Promise<PaginatedResult<Listing>> {
    const limit = params?.limit ?? DEFAULT_PAGE_SIZE;

    // Build filter conditions — always exclude deleted and non-active listings
    const conditions = [
      isNull(listings.deletedAt),
      eq(listings.status, "active"),
    ];

    if (params?.categoryId) {
      conditions.push(eq(listings.categoryId, params.categoryId));
    }
    if (params?.city) {
      conditions.push(eq(listings.city, params.city));
    }

    // Cursor pagination: get rows older than the cursor
    if (params?.cursor) {
      conditions.push(
        or(
          lt(listings.createdAt, new Date(params.cursor)),
          and(
            eq(listings.createdAt, new Date(params.cursor)),
            lt(listings.id, params.cursorId ?? "")
          )
        )!
      );
    }

    const result = await db
      .select()
      .from(listings)
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt), desc(listings.id))
      .limit(limit + 1); // Fetch one extra to check if there's a next page

    const hasNext = result.length > limit;
    const items = hasNext ? result.slice(0, limit) : result;
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor: hasNext && lastItem ? lastItem.createdAt.toISOString() : null,
      nextCursorId: hasNext && lastItem ? lastItem.id : null,
    };
  }

  async getListingsByHost(
    hostId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Listing>> {
    const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
    const conditions = [
      eq(listings.hostId, hostId),
      isNull(listings.deletedAt),
    ];

    if (params?.cursor) {
      conditions.push(
        or(
          lt(listings.createdAt, new Date(params.cursor)),
          and(
            eq(listings.createdAt, new Date(params.cursor)),
            lt(listings.id, params.cursorId ?? "")
          )
        )!
      );
    }

    const result = await db
      .select()
      .from(listings)
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt), desc(listings.id))
      .limit(limit + 1);

    const hasNext = result.length > limit;
    const items = hasNext ? result.slice(0, limit) : result;
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor: hasNext && lastItem ? lastItem.createdAt.toISOString() : null,
      nextCursorId: hasNext && lastItem ? lastItem.id : null,
    };
  }

  async updateListing(id: string, data: Partial<InsertListing>): Promise<Listing | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    // Map each field to its DB column, converting types where needed
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.latitude !== undefined) updateData.latitude = data.latitude != null ? String(data.latitude) : null;
    if (data.longitude !== undefined) updateData.longitude = data.longitude != null ? String(data.longitude) : null;
    if (data.priceHourlyCents !== undefined) updateData.priceHourlyCents = data.priceHourlyCents;
    if (data.priceDailyCents !== undefined) updateData.priceDailyCents = data.priceDailyCents;
    if (data.priceWeeklyCents !== undefined) updateData.priceWeeklyCents = data.priceWeeklyCents;
    if (data.specs !== undefined) updateData.specs = data.specs;
    if (data.safetyRequirements !== undefined) updateData.safetyRequirements = data.safetyRequirements;
    if (data.status !== undefined) updateData.status = data.status;

    const result = await db
      .update(listings)
      .set(updateData)
      .where(and(eq(listings.id, id), isNull(listings.deletedAt)))
      .returning();
    return result[0];
  }

  async softDeleteListing(id: string): Promise<void> {
    await db
      .update(listings)
      .set({ deletedAt: new Date(), status: "archived" })
      .where(eq(listings.id, id));
  }

  // ---- Listing Images ------------------------------------------------------

  async addListingImage(
    listingId: string,
    url: string,
    altText?: string,
    sortOrder?: number
  ): Promise<void> {
    await db.insert(listingImages).values({
      listingId,
      url,
      altText: altText || null,
      sortOrder: sortOrder ?? 0,
    });
  }

  async getListingImages(listingId: string) {
    return db
      .select({
        id: listingImages.id,
        url: listingImages.url,
        altText: listingImages.altText,
        sortOrder: listingImages.sortOrder,
      })
      .from(listingImages)
      .where(eq(listingImages.listingId, listingId))
      .orderBy(asc(listingImages.sortOrder));
  }

  // ---- Embeddings ----------------------------------------------------------

  /**
   * Insert or update the vector embedding for a listing.
   * Called whenever a listing's title or description changes, or when
   * bulk-generating embeddings for existing listings.
   */
  async upsertListingEmbedding(
    listingId: string,
    embedding: number[],
    model: string,
    sourceText: string
  ): Promise<void> {
    await db
      .insert(listingEmbeddings)
      .values({
        listingId,
        embedding,
        model,
        sourceText,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: listingEmbeddings.listingId,
        set: {
          embedding,
          model,
          sourceText,
          updatedAt: new Date(),
        },
      });
  }

  // ---- Bookings ------------------------------------------------------------

  async createBooking(customerId: string, data: InsertBooking): Promise<Booking> {
    const result = await db
      .insert(bookings)
      .values({
        listingId: data.listingId,
        customerId,
        hostId: data.hostId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        priceUnit: data.priceUnit,
        unitPriceCents: data.unitPriceCents,
        totalCents: data.totalCents,
        note: data.note || null,
        status: "pending",
      })
      .returning();
    return result[0];
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));
    return result[0];
  }

  async getBookingsByCustomer(
    customerId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Booking>> {
    const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
    const conditions = [eq(bookings.customerId, customerId)];

    if (params?.cursor) {
      conditions.push(lt(bookings.createdAt, new Date(params.cursor)));
    }

    const result = await db
      .select()
      .from(bookings)
      .where(and(...conditions))
      .orderBy(desc(bookings.createdAt))
      .limit(limit + 1);

    const hasNext = result.length > limit;
    const items = hasNext ? result.slice(0, limit) : result;
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor: hasNext && lastItem ? lastItem.createdAt.toISOString() : null,
      nextCursorId: hasNext && lastItem ? lastItem.id : null,
    };
  }

  async getBookingsByHost(
    hostId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Booking>> {
    const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
    const conditions = [eq(bookings.hostId, hostId)];

    if (params?.cursor) {
      conditions.push(lt(bookings.createdAt, new Date(params.cursor)));
    }

    const result = await db
      .select()
      .from(bookings)
      .where(and(...conditions))
      .orderBy(desc(bookings.createdAt))
      .limit(limit + 1);

    const hasNext = result.length > limit;
    const items = hasNext ? result.slice(0, limit) : result;
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor: hasNext && lastItem ? lastItem.createdAt.toISOString() : null,
      nextCursorId: hasNext && lastItem ? lastItem.id : null,
    };
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    // Record cancellation timestamp
    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
    }

    const result = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  // ---- Reviews -------------------------------------------------------------

  async createReview(reviewerId: string, data: InsertReview): Promise<Review> {
    const result = await db
      .insert(reviews)
      .values({
        bookingId: data.bookingId,
        reviewerId,
        revieweeId: data.revieweeId,
        listingId: data.listingId,
        rating: data.rating,
        conditionRating: data.conditionRating || null,
        accuracyRating: data.accuracyRating || null,
        communicationRating: data.communicationRating || null,
        comment: data.comment || null,
      })
      .returning();
    return result[0];
  }

  async getReviewsByListing(
    listingId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Review>> {
    const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
    const conditions = [eq(reviews.listingId, listingId)];

    if (params?.cursor) {
      conditions.push(lt(reviews.createdAt, new Date(params.cursor)));
    }

    const result = await db
      .select()
      .from(reviews)
      .where(and(...conditions))
      .orderBy(desc(reviews.createdAt))
      .limit(limit + 1);

    const hasNext = result.length > limit;
    const items = hasNext ? result.slice(0, limit) : result;
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor: hasNext && lastItem ? lastItem.createdAt.toISOString() : null,
      nextCursorId: hasNext && lastItem ? lastItem.id : null,
    };
  }

  async getAverageRating(listingId: string): Promise<{ avg: number; count: number }> {
    const result = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(eq(reviews.listingId, listingId));
    return { avg: Number(result[0].avg), count: Number(result[0].count) };
  }

  // ---- Messages ------------------------------------------------------------

  async sendMessage(senderId: string, data: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values({
        senderId,
        receiverId: data.receiverId,
        listingId: data.listingId || null,
        bookingId: data.bookingId || null,
        content: data.content,
      })
      .returning();
    return result[0];
  }

  /**
   * Gets the message thread between two users, ordered newest first.
   * Includes messages in both directions.
   */
  async getMessageThread(
    userId: string,
    otherUserId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Message>> {
    const limit = params?.limit ?? DEFAULT_PAGE_SIZE;

    const conditions = [
      or(
        and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
        and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
      )!,
    ];

    if (params?.cursor) {
      conditions.push(lt(messages.createdAt, new Date(params.cursor)));
    }

    const result = await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit + 1);

    const hasNext = result.length > limit;
    const items = hasNext ? result.slice(0, limit) : result;
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor: hasNext && lastItem ? lastItem.createdAt.toISOString() : null,
      nextCursorId: hasNext && lastItem ? lastItem.id : null,
    };
  }

  /**
   * Gets conversation previews for the inbox — last message from each
   * unique conversation partner, plus unread count.
   */
  async getConversationPreviews(userId: string) {
    // Use raw SQL for the complex aggregation query
    const result = await db.execute(sql`
      WITH ranked_messages AS (
        SELECT
          CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END AS other_user_id,
          content,
          created_at,
          read_at,
          receiver_id,
          ROW_NUMBER() OVER (
            PARTITION BY CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END
            ORDER BY created_at DESC
          ) AS rn
        FROM messages
        WHERE sender_id = ${userId} OR receiver_id = ${userId}
      )
      SELECT
        other_user_id,
        content AS last_message,
        created_at AS last_at,
        (
          SELECT COUNT(*)
          FROM messages
          WHERE sender_id = ranked_messages.other_user_id
            AND receiver_id = ${userId}
            AND read_at IS NULL
        ) AS unread_count
      FROM ranked_messages
      WHERE rn = 1
      ORDER BY created_at DESC
    `);

    return (result.rows as any[]).map((row) => ({
      otherUserId: row.other_user_id,
      lastMessage: row.last_message,
      lastAt: new Date(row.last_at),
      unreadCount: Number(row.unread_count),
    }));
  }

  async markMessagesRead(userId: string, senderId: string): Promise<void> {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.senderId, senderId),
          isNull(messages.readAt)
        )
      );
  }

  // ---- Events --------------------------------------------------------------

  /**
   * Fire-and-forget event tracking. Appends to the events table.
   * Errors are logged but don't propagate — event tracking should never
   * break the user's primary action.
   */
  async trackEvent(userId: string | null, data: InsertEvent): Promise<void> {
    try {
      await db.insert(events).values({
        userId,
        sessionId: data.sessionId || null,
        eventType: data.eventType,
        resourceType: data.resourceType || null,
        resourceId: data.resourceId || null,
        payload: data.payload || {},
      });
    } catch (error) {
      console.error("Event tracking error (non-fatal):", error);
    }
  }

  // ---- AI Conversations ----------------------------------------------------

  async createConversation(
    userId: string,
    context?: Record<string, unknown>
  ): Promise<{ id: string }> {
    const result = await db
      .insert(conversations)
      .values({
        userId,
        context: context || {},
      })
      .returning({ id: conversations.id });
    return result[0];
  }

  async addConversationMessage(
    conversationId: string,
    role: string,
    content: string,
    metadata?: Record<string, unknown>,
    tokenCount?: number
  ): Promise<void> {
    await db.insert(conversationMessages).values({
      conversationId,
      role: role as "user" | "assistant" | "system",
      content,
      metadata: metadata || {},
      tokenCount: tokenCount || null,
    });

    // Update the conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  async getConversationMessages(conversationId: string) {
    const result = await db
      .select({
        role: conversationMessages.role,
        content: conversationMessages.content,
        metadata: conversationMessages.metadata,
        createdAt: conversationMessages.createdAt,
      })
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(asc(conversationMessages.createdAt));

    return result.map((row) => ({
      role: row.role,
      content: row.content,
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: row.createdAt,
    }));
  }
}

export const storage = new DatabaseStorage();
