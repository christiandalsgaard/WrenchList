import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";
import { users, listings, type User, type InsertUser, type Listing, type InsertListing } from "@shared/schema";
import { hash, compare } from "bcrypt";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

const SALT_ROUNDS = 10;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  updateUserRole(userId: string, role: "customer" | "host"): Promise<void>;
  createListing(hostId: string, listing: InsertListing): Promise<Listing>;
  getListings(): Promise<Listing[]>;
  getListingsByCategory(category: string): Promise<Listing[]>;
  getListingsByHost(hostId: string): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const passwordHash = await hash(insertUser.password, SALT_ROUNDS);
    const result = await db.insert(users).values({
      email: insertUser.email,
      displayName: insertUser.displayName,
      phone: insertUser.phone || null,
      role: insertUser.role || "customer",
      passwordHash,
    }).returning();
    return result[0];
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const valid = await compare(password, user.passwordHash);
    return valid ? user : null;
  }

  async createListing(hostId: string, listing: InsertListing): Promise<Listing> {
    const result = await db.insert(listings).values({
      ...listing,
      hostId,
    }).returning();
    return result[0];
  }

  async getListings(): Promise<Listing[]> {
    return await db.select().from(listings);
  }

  async getListingsByCategory(category: string): Promise<Listing[]> {
    return await db.select().from(listings).where(eq(listings.category, category as any));
  }

  async getListingsByHost(hostId: string): Promise<Listing[]> {
    return await db.select().from(listings).where(eq(listings.hostId, hostId));
  }

  async getListing(id: string): Promise<Listing | undefined> {
    const result = await db.select().from(listings).where(eq(listings.id, id));
    return result[0];
  }

  async updateUserRole(userId: string, role: "customer" | "host"): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
