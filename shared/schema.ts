/**
 * WrenchList Database Schema
 *
 * Complete schema for a two-sided tool rental marketplace with LLM integration.
 * Tables: users, categories, listings, listing_images, listing_embeddings,
 *         bookings, reviews, messages, conversations, conversation_messages, events.
 *
 * Key decisions:
 * - Zod schemas are written manually (not derived from drizzle-zod) to avoid
 *   version-specific type errors and give full control over validation.
 * - Categories use a table instead of an enum so new categories can be added
 *   without schema migrations (and LLMs can classify dynamically).
 * - Lat/long are numeric for geo queries (not text).
 * - pgvector stores listing embeddings for semantic search.
 * - An append-only events table captures interaction data for ML training.
 * - Soft deletes (deletedAt) on users and listings preserve referential integrity.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  numeric,
  index,
  uniqueIndex,
  pgEnum,
  customType,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Custom Types
// ---------------------------------------------------------------------------

/**
 * pgvector column type for storing embeddings.
 * Stores float arrays as Postgres vector type, enabling similarity search
 * via cosine distance (<=>), inner product (<#>), and L2 distance (<->).
 * Defaults to 1536 dimensions (OpenAI text-embedding-3-small).
 */
const vector = customType<{
  data: number[];
  driverParam: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown): number[] {
    // pgvector returns strings like "[0.1,0.2,0.3]"
    const str = value as string;
    return str
      .slice(1, -1)
      .split(",")
      .map(Number);
  },
});

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

// User role — controls permissions and UI mode
export const userRoleEnum = pgEnum("user_role", ["customer", "host", "admin"]);

// Price unit — rental pricing granularity
export const priceUnitEnum = pgEnum("price_unit", ["hour", "day", "week"]);

// Listing lifecycle status
export const listingStatusEnum = pgEnum("listing_status", [
  "draft",     // Host is still editing
  "active",    // Visible and bookable
  "paused",    // Temporarily hidden by host
  "archived",  // Permanently hidden, kept for history
]);

// Booking lifecycle status
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",    // Requested by customer, awaiting host confirmation
  "confirmed",  // Host accepted
  "active",     // Rental period in progress
  "completed",  // Returned and finalized
  "cancelled",  // Cancelled by either party
  "disputed",   // Issue raised, needs resolution
]);

// AI conversation message roles
export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

// ---- Users ----------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull(),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zipCode: text("zip_code"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    // Numeric lat/long for geo queries — user's home location for proximity defaults
    locationLat: numeric("location_lat"),
    locationLng: numeric("location_lng"),
    role: userRoleEnum("role").default("customer").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"), // Soft delete
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ]
);

// ---- Categories -----------------------------------------------------------
// Replaces the hardcoded listing_category enum. Hierarchical via parentId
// self-reference so we can have "Power Tools > Drills" without migrations.

export const categories = pgTable(
  "categories",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text("slug").notNull().unique(), // URL-friendly identifier, e.g. "power-tools"
    name: text("name").notNull(),          // Display name, e.g. "Power Tools"
    description: text("description"),
    parentId: varchar("parent_id"),        // Self-referencing FK for hierarchy
    iconName: text("icon_name"),           // Feather icon name for the UI
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("categories_slug_idx").on(table.slug),
    index("categories_parent_idx").on(table.parentId),
  ]
);

// ---- Listings -------------------------------------------------------------

export const listings = pgTable(
  "listings",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    hostId: varchar("host_id")
      .notNull()
      .references(() => users.id),
    categoryId: varchar("category_id")
      .notNull()
      .references(() => categories.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: listingStatusEnum("status").default("active").notNull(),

    // Location — numeric for geo queries, city for display/filtering
    city: text("city").notNull(),
    state: text("state"),
    relativeLocation: text("relative_location"), // e.g. "Near downtown", for privacy
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),

    // Multi-tier pricing in cents — null means not offered at that tier
    priceHourlyCents: integer("price_hourly_cents"),
    priceDailyCents: integer("price_daily_cents"),
    priceWeeklyCents: integer("price_weekly_cents"),

    // Flexible specs — varies by category (e.g. { "psi": 4000, "hoseLength": "50ft" })
    specs: jsonb("specs").$type<Record<string, unknown>>().default({}),

    // Safety and rules text
    safetyRequirements: text("safety_requirements"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"), // Soft delete
  },
  (table) => [
    index("listings_host_idx").on(table.hostId),
    index("listings_category_idx").on(table.categoryId),
    index("listings_status_idx").on(table.status),
    index("listings_city_idx").on(table.city),
    // Composite index for the most common query: active listings in a category + city
    index("listings_category_city_status_idx").on(
      table.categoryId,
      table.city,
      table.status
    ),
    index("listings_created_idx").on(table.createdAt),
  ]
);

// ---- Listing Images -------------------------------------------------------
// Separate from listings for proper ordering, metadata, and alt text.

export const listingImages = pgTable(
  "listing_images",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    listingId: varchar("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altText: text("alt_text"),            // Accessibility — can be auto-generated by LLM
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("listing_images_listing_idx").on(table.listingId),
  ]
);

// ---- Listing Embeddings ---------------------------------------------------
// pgvector storage for semantic search. One embedding per listing, regenerated
// when title/description changes. Enables "find me something to cut metal"
// style queries without keyword matching.

export const listingEmbeddings = pgTable(
  "listing_embeddings",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    listingId: varchar("listing_id")
      .notNull()
      .unique()
      .references(() => listings.id, { onDelete: "cascade" }),
    // The vector embedding — 1536 dims for OpenAI text-embedding-3-small
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    // Which model produced this embedding (for future migration between models)
    model: text("model").notNull(),
    // The source text that was embedded, so we know when to regenerate
    sourceText: text("source_text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("listing_embeddings_listing_idx").on(table.listingId),
    // HNSW index for fast approximate nearest neighbor search
    // This is created via raw SQL in migrations since Drizzle doesn't support
    // vector index syntax directly:
    // CREATE INDEX listing_embeddings_vector_idx ON listing_embeddings
    //   USING hnsw (embedding vector_cosine_ops);
  ]
);

// ---- Bookings -------------------------------------------------------------

export const bookings = pgTable(
  "bookings",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    listingId: varchar("listing_id")
      .notNull()
      .references(() => listings.id),
    customerId: varchar("customer_id")
      .notNull()
      .references(() => users.id),
    hostId: varchar("host_id")
      .notNull()
      .references(() => users.id),
    status: bookingStatusEnum("status").default("pending").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    // Snapshot pricing at booking time — prices on the listing may change later
    priceUnit: priceUnitEnum("price_unit").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    // Optional message from customer to host at booking time
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    cancelledAt: timestamp("cancelled_at"),
  },
  (table) => [
    index("bookings_listing_idx").on(table.listingId),
    index("bookings_customer_idx").on(table.customerId),
    index("bookings_host_idx").on(table.hostId),
    index("bookings_status_idx").on(table.status),
    // For availability checks: find bookings overlapping a date range
    index("bookings_listing_dates_idx").on(
      table.listingId,
      table.startDate,
      table.endDate
    ),
  ]
);

// ---- Reviews --------------------------------------------------------------

export const reviews = pgTable(
  "reviews",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    bookingId: varchar("booking_id")
      .notNull()
      .references(() => bookings.id),
    reviewerId: varchar("reviewer_id")
      .notNull()
      .references(() => users.id),
    revieweeId: varchar("reviewee_id")
      .notNull()
      .references(() => users.id),
    listingId: varchar("listing_id")
      .notNull()
      .references(() => listings.id),
    // Overall rating 1-5
    rating: integer("rating").notNull(),
    // Structured sub-ratings for LLM analysis and trust scoring
    conditionRating: integer("condition_rating"),      // Was the tool in good shape?
    accuracyRating: integer("accuracy_rating"),         // Did listing match reality?
    communicationRating: integer("communication_rating"), // Host/customer responsiveness
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("reviews_listing_idx").on(table.listingId),
    index("reviews_reviewee_idx").on(table.revieweeId),
    index("reviews_booking_idx").on(table.bookingId),
  ]
);

// ---- Messages (User-to-User) ---------------------------------------------

export const messages = pgTable(
  "messages",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    senderId: varchar("sender_id")
      .notNull()
      .references(() => users.id),
    receiverId: varchar("receiver_id")
      .notNull()
      .references(() => users.id),
    // Optional context — which listing or booking this message is about
    listingId: varchar("listing_id").references(() => listings.id),
    bookingId: varchar("booking_id").references(() => bookings.id),
    content: text("content").notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // For inbox queries: "show me all messages I've received, newest first"
    index("messages_receiver_idx").on(table.receiverId, table.createdAt),
    index("messages_sender_idx").on(table.senderId, table.createdAt),
    // For thread views: "show all messages about this listing between these two users"
    index("messages_listing_idx").on(table.listingId),
  ]
);

// ---- AI Conversations -----------------------------------------------------
// Stores sessions with the AI assistant. Each conversation is a thread
// tied to a user, with optional context about what they were doing.

export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title"), // Auto-generated summary of the conversation
    // What the user was doing when they started the conversation —
    // e.g. { screen: "listings", categoryId: "power-tools", searchQuery: "drill" }
    context: jsonb("context").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("conversations_user_idx").on(table.userId, table.updatedAt),
  ]
);

// ---- AI Conversation Messages ---------------------------------------------

export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    conversationId: varchar("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    // Metadata for tool calls, function results, token usage, model info
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    tokenCount: integer("token_count"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("conv_messages_conversation_idx").on(
      table.conversationId,
      table.createdAt
    ),
  ]
);

// ---- Events (Interaction Log) ---------------------------------------------
// Append-only event stream for all user interactions. This is the ML training
// data foundation — search queries, listing views, filter usage, booking
// intent signals. JSONB payload keeps it flexible for any event shape.

export const events = pgTable(
  "events",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id), // Nullable for anonymous
    sessionId: varchar("session_id"),   // Groups events within a session
    eventType: text("event_type").notNull(), // e.g. "search", "listing_view", "filter_apply"
    // What kind of resource was involved and its ID
    resourceType: text("resource_type"), // e.g. "listing", "category", "profile"
    resourceId: varchar("resource_id"),
    // Flexible payload — varies by event type
    // e.g. { query: "drill press", results: 12, filters: { city: "Oakland" } }
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Primary query: "what did this user do recently?"
    index("events_user_type_idx").on(table.userId, table.eventType, table.createdAt),
    // Analytics query: "how many views did this listing get?"
    index("events_resource_idx").on(table.resourceType, table.resourceId),
    // Time-series query: "what happened in the last hour?"
    index("events_created_idx").on(table.createdAt),
  ]
);

// ---------------------------------------------------------------------------
// Zod Validation Schemas
// Written manually to avoid drizzle-zod version incompatibilities and give
// full control over validation messages and field inclusion.
// ---------------------------------------------------------------------------

// ---- User schemas ---------------------------------------------------------

export const insertUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  bio: z.string().optional(),
  role: z.enum(["customer", "host"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
});

// ---- Listing schemas ------------------------------------------------------

export const insertListingSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  relativeLocation: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  priceHourlyCents: z.number().positive().int().optional(),
  priceDailyCents: z.number().positive().int().optional(),
  priceWeeklyCents: z.number().positive().int().optional(),
  specs: z.record(z.unknown()).optional(),
  safetyRequirements: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
}).refine(
  // At least one price tier must be set
  (data) => data.priceHourlyCents || data.priceDailyCents || data.priceWeeklyCents,
  { message: "At least one price (hourly, daily, or weekly) is required" }
);

// ---- Booking schemas ------------------------------------------------------

export const insertBookingSchema = z.object({
  listingId: z.string().min(1),
  hostId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  priceUnit: z.enum(["hour", "day", "week"]),
  unitPriceCents: z.number().positive().int(),
  totalCents: z.number().positive().int(),
  note: z.string().optional(),
});

// ---- Review schemas -------------------------------------------------------

export const insertReviewSchema = z.object({
  bookingId: z.string().min(1),
  revieweeId: z.string().min(1),
  listingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  conditionRating: z.number().int().min(1).max(5).optional(),
  accuracyRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
});

// ---- Message schemas ------------------------------------------------------

export const insertMessageSchema = z.object({
  receiverId: z.string().min(1),
  listingId: z.string().optional(),
  bookingId: z.string().optional(),
  content: z.string().min(1, "Message cannot be empty"),
});

// ---- Event schemas --------------------------------------------------------

export const insertEventSchema = z.object({
  sessionId: z.string().optional(),
  eventType: z.string().min(1),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// TypeScript Types
// ---------------------------------------------------------------------------

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type Category = typeof categories.$inferSelect;
export type ListingImage = typeof listingImages.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
