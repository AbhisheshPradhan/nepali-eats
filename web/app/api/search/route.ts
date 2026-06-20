import { NextResponse } from "next/server";
import { searchSuggest } from "@/lib/queries";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") || "").trim();
  if (q.length < 3) return NextResponse.json({ restaurants: [], locations: [] });
  const data = await searchSuggest(q);
  return NextResponse.json(data);
}
