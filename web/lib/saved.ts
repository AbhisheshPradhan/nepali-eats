import { query } from "@/lib/db";

// Saved/bookmarked restaurants, keyed by the local users.id (not the Clerk id).
// Callers resolve the Clerk user to a local row via ensureCurrentUser first.

export async function getSavedIds(userId: string): Promise<string[]> {
  const rows = await query<{ restaurant_id: string }>(
    `SELECT restaurant_id FROM saved_restaurants
      WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map((r) => String(r.restaurant_id));
}

export async function isSaved(
  userId: string,
  restaurantId: string | number,
): Promise<boolean> {
  const rows = await query(
    `SELECT 1 FROM saved_restaurants WHERE user_id = $1 AND restaurant_id = $2`,
    [userId, restaurantId],
  );
  return rows.length > 0;
}

export async function setSaved(
  userId: string,
  restaurantId: string | number,
  saved: boolean,
): Promise<void> {
  if (saved) {
    await query(
      `INSERT INTO saved_restaurants (user_id, restaurant_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, restaurantId],
    );
  } else {
    await query(
      `DELETE FROM saved_restaurants WHERE user_id = $1 AND restaurant_id = $2`,
      [userId, restaurantId],
    );
  }
}
