import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/repository";
export const runtime = "nodejs";
export function GET(request: NextRequest) {
  try {
    return NextResponse.json(query(request.nextUrl.searchParams), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Unable to search. Check your search parameters and try again.",
      },
      { status: 400 },
    );
  }
}
