import { NextResponse } from "next/server";
import { validateHistory, validateRecommendation } from "@/app/lib/ai-recommendations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 16_000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  let history;
  try {
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 || !("transactions" in body)) {
      throw new Error("Invalid request.");
    }
    history = validateHistory((body as { transactions: unknown }).transactions);
  } catch {
    return NextResponse.json({ error: "Provide 1–30 valid USD transactions." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI recommendations are not configured." }, { status: 503 });
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Analyze the supplied transaction history for optional aggregation advice. Recommend only when repeated purchases support it. Return concise, cautious advice. Never claim a payment, transfer, or fee saving occurred; do not invent evidence. If unsupported, recommend false and amount zero." },
          { role: "user", content: JSON.stringify({ transactions: history }) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "aggregation_recommendation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendAggregation: { type: "boolean" },
                reason: { type: "string" },
                recommendedAmountMinor: { type: "integer" },
                confidence: { type: "number" },
              },
              required: ["recommendAggregation", "reason", "recommendedAmountMinor", "confidence"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
    if (!response.ok) throw new Error("AI service unavailable.");
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("Malformed AI response.");
    const recommendation = validateRecommendation(history, JSON.parse(content));
    return NextResponse.json(recommendation, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "A safe recommendation could not be produced. No financial action was taken." }, { status: 502 });
  }
}
