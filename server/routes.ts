import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertListingSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = await storage.createUser(data);
      const { passwordHash, ...safeUser } = user;
      return res.status(201).json({ user: safeUser });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Signup error:", error);
      return res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.verifyPassword(data.email, data.password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const { passwordHash, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Signin error:", error);
      return res.status(500).json({ error: "Failed to sign in" });
    }
  });

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

      if (host.role !== "host") {
        await storage.updateUserRole(hostId, "host");
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
      const { category } = req.query;
      let listings;
      
      if (category && typeof category === "string") {
        listings = await storage.getListingsByCategory(category);
      } else {
        listings = await storage.getListings();
      }
      
      return res.json({ listings });
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
      const listings = await storage.getListingsByHost(req.params.id);
      return res.json({ listings });
    } catch (error) {
      console.error("Get user listings error:", error);
      return res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
