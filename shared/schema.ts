import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["customer", "host"]);
export const priceUnitEnum = pgEnum("price_unit", ["hour", "day", "week"]);
export const listingCategoryEnum = pgEnum("listing_category", ["workshop", "equipment", "tools"]);

export const users = pgTable("users", {
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
  role: userRoleEnum("role").default("customer").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const listings = pgTable("listings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  hostId: varchar("host_id").notNull().references(() => users.id),
  category: listingCategoryEnum("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  relativeLocation: text("relative_location"),
  city: text("city").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  priceCents: integer("price_cents").notNull(),
  priceUnit: priceUnitEnum("price_unit").notNull(),
  photos: jsonb("photos").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  role: z.enum(["customer", "host"]).optional(),
}).omit({ id: true, createdAt: true, passwordHash: true }).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertListingSchema = createInsertSchema(listings, {
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
  priceCents: z.number().positive("Price must be positive"),
}).omit({ id: true, hostId: true, createdAt: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;
