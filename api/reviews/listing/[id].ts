/**
 * GET /api/reviews/listing/:id
 * Returns paginated reviews for a listing, plus average rating and count.
 */
import { storage } from "../../../server/storage";

export async function GET(
  request: Request,
  context: { params: { id: string } }
): Promise<Response> {
  try {
    const { id } = context.params;
    const url = new URL(request.url);

    // Extract cursor-based pagination params
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const cursorId = url.searchParams.get("cursorId") ?? undefined;
    const limitStr = url.searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const result = await storage.getReviewsByListing(id, { cursor, cursorId, limit });
    const rating = await storage.getAverageRating(id);

    return Response.json({
      ...result,
      averageRating: rating.avg,
      totalReviews: rating.count,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return Response.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
