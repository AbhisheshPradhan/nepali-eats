import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { triageQueue, type TriageMode } from "@/lib/admin/queries";

const PAGE_SIZE = 24;

// GET ?mode&state&hideReviewed&page -> the next batch of triage cards as JSON,
// so the client can append (load-more / infinite scroll) without a full reload.
export async function GET(request: Request) {
  const blocked = await requireAdmin();
  if (blocked) return blocked;

  const url = new URL(request.url);
  const mode: TriageMode = url.searchParams.get("mode") === "menu" ? "menu" : "photo";
  const state = url.searchParams.get("state") || undefined;
  const hideReviewed = url.searchParams.get("hideReviewed") !== "0";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const items = await triageQueue({ mode, state, hideReviewed }, PAGE_SIZE, offset);
  return NextResponse.json({ ok: true, items, page, hasMore: items.length === PAGE_SIZE });
}
