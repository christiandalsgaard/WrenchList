/**
 * POST /api/auth/signin
 * Authenticates a user by email and password.
 * Returns the user object (minus passwordHash) on success.
 */
import { loginSchema } from "../../shared/schema";
import { storage } from "../../server/storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    // Verify credentials against stored hash
    const user = await storage.verifyPassword(data.email, data.password);
    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Strip sensitive/internal fields from the response
    const { passwordHash, deletedAt, ...safeUser } = user;
    return Response.json({ user: safeUser });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: fromZodError(error).message }, { status: 400 });
    }
    console.error("Signin error:", error);
    return Response.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
