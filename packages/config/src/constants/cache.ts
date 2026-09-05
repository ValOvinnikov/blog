/**
 * Full Route Cache backstop for tenant content routes: if the publish
 * webhook's targeted `revalidatePath` purge is ever missed (a derivation
 * bug, a renamed slug, a failed request), a stale prerendered page expires
 * and regenerates within this many seconds instead of staying wrong
 * indefinitely. Well above the Data Cache's 3600s TTL, but short enough to
 * bound a missed purge to part of a working day rather than a full one —
 * this is a correctness floor for a rare failure mode, not a freshness
 * target, so it trades off against regenerating every tenant×locale path
 * more often than that.
 *
 * Next's route segment config requires a literal, so no route can import
 * this value into its own `export const revalidate` — each route hardcodes
 * the literal, and this constant is what its test asserts that literal
 * against.
 */
export const CONTENT_ROUTE_REVALIDATE_SECONDS = 21600;
