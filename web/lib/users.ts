import { auth, currentUser } from "@clerk/nextjs/server";
import { query } from "@/lib/db";

// Authentication is Clerk; authorization is ours. This module owns the local
// `users` row (Clerk id -> role) and the `restaurant_owners` RBAC mapping.

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export type Role = "owner" | "admin";

export type DbUser = {
  id: string; // bigint -> string from pg
  clerk_user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  role: Role;
};

// Insert or update the local user row for a Clerk identity. Role is forced to
// 'admin' for allowlisted ids; otherwise it defaults to 'owner' and an existing
// admin is never downgraded.
export async function upsertUser(u: {
  clerkUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
}): Promise<void> {
  const role: Role = ADMIN_IDS.includes(u.clerkUserId) ? "admin" : "owner";
  await query(
    `INSERT INTO users (clerk_user_id, email, first_name, last_name, image_url, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (clerk_user_id) DO UPDATE
       SET email      = EXCLUDED.email,
           first_name = EXCLUDED.first_name,
           last_name  = EXCLUDED.last_name,
           image_url  = EXCLUDED.image_url,
           role       = CASE
                          WHEN users.role = 'admin' OR EXCLUDED.role = 'admin'
                          THEN 'admin' ELSE users.role
                        END,
           updated_at = now()`,
    [
      u.clerkUserId,
      u.email ?? null,
      u.firstName ?? null,
      u.lastName ?? null,
      u.imageUrl ?? null,
      role,
    ],
  );
}

export async function getUserByClerkId(clerkUserId: string): Promise<DbUser | null> {
  const rows = await query<DbUser>(
    `SELECT id, clerk_user_id, email, first_name, last_name, image_url, role
       FROM users WHERE clerk_user_id = $1`,
    [clerkUserId],
  );
  return rows[0] ?? null;
}

export async function deleteUserByClerkId(clerkUserId: string): Promise<void> {
  await query(`DELETE FROM users WHERE clerk_user_id = $1`, [clerkUserId]);
}

// Lazy fallback to the webhook: ensure the signed-in Clerk user has a local row,
// then return it. Call from authenticated server contexts (e.g. the owner
// dashboard) so a user always exists even if the webhook was missed.
export async function ensureCurrentUser(): Promise<DbUser | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const cu = await currentUser();
  await upsertUser({
    clerkUserId: userId,
    email: cu?.primaryEmailAddress?.emailAddress ?? null,
    firstName: cu?.firstName ?? null,
    lastName: cu?.lastName ?? null,
    imageUrl: cu?.imageUrl ?? null,
  });
  return getUserByClerkId(userId);
}

// --- RBAC: restaurant ownership -------------------------------------------

export async function ownedRestaurantIds(userId: string): Promise<string[]> {
  const rows = await query<{ restaurant_id: string }>(
    `SELECT restaurant_id FROM restaurant_owners WHERE user_id = $1`,
    [userId],
  );
  return rows.map((r) => String(r.restaurant_id));
}

export async function isOwnerOf(
  userId: string,
  restaurantId: string | number,
): Promise<boolean> {
  const rows = await query(
    `SELECT 1 FROM restaurant_owners WHERE user_id = $1 AND restaurant_id = $2`,
    [userId, restaurantId],
  );
  return rows.length > 0;
}

// Grant / revoke ownership (called from the claim-approval flow, later).
export async function grantOwnership(
  userId: string,
  restaurantId: string | number,
): Promise<void> {
  await query(
    `INSERT INTO restaurant_owners (user_id, restaurant_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, restaurantId],
  );
}

export async function revokeOwnership(
  userId: string,
  restaurantId: string | number,
): Promise<void> {
  await query(
    `DELETE FROM restaurant_owners WHERE user_id = $1 AND restaurant_id = $2`,
    [userId, restaurantId],
  );
}
