/**
 * POST /api/auth/signup
 * Creates a new user account. Validates input with Zod, hashes password,
 * and returns the user object (minus passwordHash).
 */
import { insertUserSchema } from "../../shared/schema";
import { storage } from "../../server/storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const data = insertUserSchema.parse(body);

    // Check if email is already registered
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return Response.json({ error: "Email already registered" }, { status: 400 });
    }

    // Create user and strip passwordHash from response
    const user = await storage.createUser(data);
    // Strip sensitive/internal fields from the response
    const { passwordHash, deletedAt, ...safeUser } = user;
    return Response.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: fromZodError(error).message }, { status: 400 });
    }
    console.error("Signup error:", error);
    return Response.json({ error: "Failed to create account" }, { status: 500 });
  }
}
