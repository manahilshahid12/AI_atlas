import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_FUNCTION_URL =
  "https://nwesagjtzdwcqqlmsuhr.supabase.co/functions/v1/generate-matches";

// Allowed origins — add more if needed
const ALLOWED_ORIGINS = [
  "https://proof-of-talk-atlas.vercel.app",
  "http://localhost:5173",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers["origin"] || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  // Set CORS headers on every response
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, x-client-info, apikey, content-type"
  );
  res.setHeader("Vary", "Origin");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const upstreamRes = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers["authorization"]
          ? { Authorization: req.headers["authorization"] as string }
          : {}),
        ...(req.headers["apikey"]
          ? { apikey: req.headers["apikey"] as string }
          : {}),
      },
      body: JSON.stringify(req.method === "GET" ? {} : (req.body ?? {})),
    });

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    console.error("Proxy error:", err);
    return res.status(502).json({ error: "Failed to reach upstream function" });
  }
}
