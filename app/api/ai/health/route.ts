import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ openai_ok: false, reason: "missing_key" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: "Reply with exactly OK",
        max_output_tokens: 64,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      let reason = `http_${response.status}`;
      try {
        const parsed = JSON.parse(body);
        reason = parsed?.error?.code || parsed?.error?.type || reason;
      } catch {}
      return NextResponse.json({ openai_ok: false, reason }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }

    const payload = await response.json();
    const text = typeof payload?.output_text === "string" ? payload.output_text.trim() : "";
    return NextResponse.json({ openai_ok: text === "OK", reason: text === "OK" ? "ok" : "unexpected_output" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ openai_ok: false, reason: "network_or_runtime_error" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
