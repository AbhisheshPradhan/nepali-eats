// Re-export of the shared editor handlers (/api/editor/...). This admin URL is
// kept so the edge-gated admin tools (triage, review, old form) keep working:
// proxy.ts hard-gates /api/admin to ADMIN_USER_IDS before these run, and the
// shared guard passes admins through with full (unfiltered) capability.
export { POST, DELETE } from "../../../../editor/restaurants/[slug]/logo/route";
