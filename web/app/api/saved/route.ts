import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureCurrentUser } from "@/lib/users";
import { getSavedIds, isSaved, setSaved } from "@/lib/saved";

// GET  /api/saved                  -> { ids: string[] }   (all saved for the user)
// GET  /api/saved?restaurantId=123 -> { saved: boolean }
// POST /api/saved { restaurantId, saved } -> { saved }     (toggle on/off)

export async function GET(req: NextRequest) {
  const me = await currentLocalUserId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rid = req.nextUrl.searchParams.get("restaurantId");
  if (rid) return NextResponse.json({ saved: await isSaved(me, rid) });
  return NextResponse.json({ ids: await getSavedIds(me) });
}

export async function POST(req: NextRequest) {
  const me = await currentLocalUserId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const restaurantId = String(body.restaurantId ?? "");
  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }
  const saved = !!body.saved;
  await setSaved(me, restaurantId, saved);
  return NextResponse.json({ saved });
}

// Map the signed-in Clerk user to our local users.id, provisioning the row if
// the webhook hasn't fired yet.
async function currentLocalUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const me = await ensureCurrentUser();
  return me?.id ?? null;
}
