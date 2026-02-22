const SUPABASE_FUNCTION_URL =
  "https://nwesagjtzdwcqqlmsuhr.supabase.co/functions/v1/generate-matches";

const ALLOWED_ORIGINS = [
  "https://proof-of-talk-atlas.vercel.app",
  "http://localhost:5173",
];

export default async function handler(req, res) {
  const origin = req.headers?.origin || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, x-client-info, apikey, content-type"
  );
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const upstreamRes = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers?.authorization
          ? { Authorization: req.headers.authorization }
          : {}),
        ...(req.headers?.apikey ? { apikey: req.headers.apikey } : {}),
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const text = await upstreamRes.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { error: text };
    }

    return res.status(upstreamRes.status).json(json);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(502).json({ error: "Failed to reach upstream function" });
  }
}
