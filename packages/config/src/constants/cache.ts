/**
 * ISR TTLs for this repo's caches, one constant per cache with its own
 * invalidation path. The same unit (seconds) backs two different Next.js
 * caches — the Full Route Cache (rendered HTML per resolved path) and the
 * Data Cache (individual fetches) — so each constant below names which one
 * it governs and what purges it on demand.
 */

/**
 * Full Route Cache backstop for tenant content routes: if the publish
 * webhook's targeted `revalidatePath` purge is ever missed (a derivation
 * bug, a renamed slug, a failed request), a stale prerendered page expires
 * and regenerates within this many seconds instead of staying wrong
 * indefinitely. Well above the Data Cache tiers below, but short enough to
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

/**
 * Data Cache TTL for Sanity content reads: the backstop behind the publish
 * webhook's on-demand tag purge, bounding how long a missed or failed purge
 * can leave a fetch stale.
 */
export const SANITY_CONTENT_REVALIDATE_SECONDS = 3600;

/**
 * Data Cache TTL for tenant-config reads backed by Postgres (site config,
 * effective settings/features, tenant plan): the backstop behind
 * `/api/revalidate-site-config`, which the operator/tenant admin app calls
 * on every Look/Voice/Features save to purge these entries on demand.
 */
export const TENANT_CONFIG_REVALIDATE_SECONDS = 3600;
