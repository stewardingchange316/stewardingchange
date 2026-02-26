const ALLOWED_ORIGINS = new Set(
  [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    Deno.env.get("ALLOWED_ORIGIN") ?? "",
  ].filter(Boolean)
);

/**
 * Returns appropriate CORS headers for a given request Origin.
 *
 * - No Origin (curl, server-to-server): returns headers without Allow-Origin
 *   so the request proceeds normally.
 * - Known Origin (localhost, production domain): returns full CORS headers.
 * - Unknown Origin: returns empty object — browser will block the request.
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const base = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (!origin) {
    // Server-to-server or Supabase dashboard — no CORS check needed
    return base;
  }

  if (ALLOWED_ORIGINS.has(origin)) {
    return { ...base, "Access-Control-Allow-Origin": origin };
  }

  // Unknown browser origin — omit Allow-Origin so browser blocks it
  return {};
}
