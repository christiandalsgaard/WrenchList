/**
 * GET /api/categories
 * Returns all categories ordered by sortOrder, then name.
 */
import { storage } from "../../server/storage";

export async function GET(): Promise<Response> {
  try {
    const cats = await storage.getCategories();
    return Response.json({ categories: cats });
  } catch (error) {
    console.error("Get categories error:", error);
    return Response.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
