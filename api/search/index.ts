/**
 * POST /api/search
 * Semantic search over listings using vector similarity.
 * Accepts a 1536-dimension embedding (from text-embedding-3-small) and
 * returns the most similar active listings ranked by cosine similarity.
 *
 * Body: { embedding: number[], limit?: number, categoryId?: string, city?: string }
 *
 * This is the core LLM integration point — a frontend or AI agent generates
 * an embedding from the user's natural language query, then passes it here
 * to find relevant listings without keyword matching.
 */
import { storage } from "../../server/storage";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { embedding, limit, categoryId, city } = body;

    if (!embedding || !Array.isArray(embedding)) {
      return Response.json({ error: "embedding array is required" }, { status: 400 });
    }

    // Validate embedding dimensions (1536 for OpenAI text-embedding-3-small)
    if (embedding.length !== 1536) {
      return Response.json(
        { error: `Expected 1536-dimension embedding, got ${embedding.length}` },
        { status: 400 }
      );
    }

    const results = await storage.searchListingsByEmbedding(
      embedding,
      Math.min(limit || 10, 50), // Cap at 50 results to prevent abuse
      categoryId,
      city
    );

    return Response.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
