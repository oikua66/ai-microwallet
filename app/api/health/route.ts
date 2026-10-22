import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "ai-microwallet",
    status: "healthy",
  });
}
