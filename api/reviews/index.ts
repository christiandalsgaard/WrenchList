/**
 * POST /api/reviews
 * Creates a review for a completed booking. Requires reviewerId in body.
 */
import { insertReviewSchema } from "../../shared/schema";
import { storage } from "../../server/storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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
