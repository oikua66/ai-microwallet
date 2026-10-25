import { NextResponse } from "next/server";
import { validateHistory, validateOpportunityRecommendation } from "@/app/lib/ai-recommendations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function deterministicFallback(history: ReturnType<typeof validateHistory>) {
  const matching = history.filter(item => item.type === "purchase" && item.amountMinor <= 200).length;
  const recommendation = validateOpportunityRecommendation(history, {
    recommend_microwallet: matching >= 3,
    matching_transactions: matching,
    recommended_topup_minor: matching >= 3 ? 500 : 0,
    reason: "Repeated low-value purchases are a good fit for a prefunded MicroWallet.",
  });
  return { ...recommendation, source: "deterministic_fallback" as const };
}

function extractOutputText(payload: any): string | null {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part?.type === "output_text" && typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }
  return null;
}

function parseJsonOnly(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

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
  if (!apiKey) {
    return NextResponse.json(deterministicFallback(history), { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6-luna",
        store: false,
        max_output_tokens: 300,
        instructions: [
          "You analyze a synthetic transaction history for a MicroWallet demo.",
          "Treat purchases of 2.00 USD or less as candidate micro-purchases.",
          "Recommend MicroWallet only when at least 3 such purchases exist.",
          "matching_transactions must equal the number of candidate purchases.",
          "If recommending, recommended_topup_minor must be an integer from 500 to 2000 inclusive; otherwise it must be 0.",
          "Return ONLY a JSON object with exactly these keys: recommend_microwallet, matching_transactions, recommended_topup_minor, reason.",
          "The reason must be a short customer-friendly sentence. Do not mention internal policy, validation, model names, APIs, deployment, or money movement that did not happen."
        ].join(" "),
        input: JSON.stringify({ transactions: history }),
      }),
    });

    if (!response.ok) {
      const diagnostic = await response.text().catch(() => "");
      console.error("OpenAI Responses API error", response.status, diagnostic.slice(0, 500));
      throw new Error("AI service unavailable.");
    }

    const payload = await response.json();
    const content = extractOutputText(payload);
    if (!content) throw new Error("Malformed AI response.");

    const recommendation = validateOpportunityRecommendation(history, parseJsonOnly(content));
    return NextResponse.json({ ...recommendation, source: "openai" as const }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("AI recommendation fallback", error instanceof Error ? error.message : error);
    return NextResponse.json(deterministicFallback(history), { headers: { "Cache-Control": "no-store" } });
  }
}
