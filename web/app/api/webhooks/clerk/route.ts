import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { upsertUser, deleteUserByClerkId } from "@/lib/users";

// Provisions our local `users` row when someone signs up (and keeps it in sync
// on update/delete). Configure in the Clerk dashboard: Webhooks -> add endpoint
// https://<domain>/api/webhooks/clerk, subscribe to user.created / user.updated
// / user.deleted, and set CLERK_WEBHOOK_SIGNING_SECRET from the endpoint's
// signing secret. verifyWebhook checks the Svix signature using that secret.
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const d = evt.data;
      const primary =
        d.email_addresses.find((e) => e.id === d.primary_email_address_id) ??
        d.email_addresses[0];
      await upsertUser({
        clerkUserId: d.id,
        email: primary?.email_address ?? null,
        firstName: d.first_name ?? null,
        lastName: d.last_name ?? null,
        imageUrl: d.image_url ?? null,
      });
      break;
    }
    case "user.deleted": {
      if (evt.data.id) await deleteUserByClerkId(evt.data.id);
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
