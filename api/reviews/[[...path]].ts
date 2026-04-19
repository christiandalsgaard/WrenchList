/**
 * Catch-all handler for /api/reviews/*
 * Consolidates review routes into one Vercel Function.
 *
 * Routes handled:
 *   POST  /api/reviews                  — Create review
 *   GET   /api/reviews/listing/:id       — Reviews for a listing
 */
import { insertReviewSchema } from "../../shared/schema";
import { storage } from "../../server/storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.replace(/^\/api\/reviews\/?/, "").split("/").filter(Boolean);

    // GET /api/reviews/listing/:id
    if (segments[0] === "listing" && segments[1]) {
      const pagination = {
        cursor: url.searchParams.get("cursor") ?? undefined,
        cursorId: url.searchParams.get("cursorId") ?? undefined,
        limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : undefined,
      };
      const result = await storage.getReviewsByListing(segments[1], pagination);
      const rating = await storage.getAverageRating(segments[1]);
      return Response.json({ ...result, averageRating: rating.avg, totalReviews: rating.count });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Get reviews error:", error);
    return Response.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { reviewerId, ...reviewData } = body;

    if (!reviewerId) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const data = insertReviewSchema.parse(reviewData);
    const review = await storage.createReview(reviewerId, data);
    return Response.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: fromZodError(error).message }, { status: 400 });
    }
    console.error("Create review error:", error);
    return Response.json({ error: "Failed to create review" }, { status: 500 });
  }
}
