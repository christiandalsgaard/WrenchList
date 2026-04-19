/**
 * Simple in-memory rate limiter for Express routes.
 *
 * Uses a sliding window counter per IP address. Stores request timestamps
 * in a Map and prunes expired entries on each check.
 *
 * For production at millions of users, replace with Upstash Redis rate limiting
 * (@upstash/ratelimit) which works across all Vercel Function instances.
 * This in-memory version works for local dev and single-instance servers.
 */
import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store — shared across routes within one process
const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60 seconds to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 60000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 60000);

/**
 * Creates rate-limiting middleware.
 * @param maxRequests — Max requests allowed within the window
 * @param windowMs — Window size in milliseconds (default 60s)
 */
export function rateLimit(maxRequests: number, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Use X-Forwarded-For (Vercel/proxy) or fallback to socket IP
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      || req.socket.remoteAddress
      || "unknown";

    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const entry = store.get(key) || { timestamps: [] };

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

    if (entry.timestamps.length >= maxRequests) {
      // Rate limit exceeded — tell client when they can retry
      const retryAfter = Math.ceil((entry.timestamps[0] + windowMs - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    entry.timestamps.push(now);
    store.set(key, entry);
    next();
  };
}

/**
 * Vercel Function rate limit check (stateless, header-based).
 * Uses Vercel's X-Real-Ip header. Returns a 429 Response if the IP
 * exceeds the limit, or null if the request is allowed.
 *
 * NOTE: This is a per-instance check (each cold start has its own Map).
 * For true distributed rate limiting at scale, use @upstash/ratelimit.
 */
const vercelStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  request: globalThis.Request,
  maxRequests: number = 30,
  windowMs: number = 60000
): globalThis.Response | null {
  const ip = request.headers.get("x-real-ip") || "unknown";

  const now = Date.now();
  const entry = vercelStore.get(ip) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const retryAfter = Math.ceil((entry.timestamps[0] + windowMs - now) / 1000);
    return new globalThis.Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  entry.timestamps.push(now);
  vercelStore.set(ip, entry);
  return null;
}
