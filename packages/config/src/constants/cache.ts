const ONE_DAY_IN_SECONDS = 86400;

// A page caches only as long as the shortest window it reads, so these three move together.
// Next's route segment config requires a literal, so each content route hardcodes this value and its test asserts the literal against it.
export const CONTENT_ROUTE_REVALIDATE_SECONDS = ONE_DAY_IN_SECONDS;

export const SANITY_CONTENT_REVALIDATE_SECONDS = ONE_DAY_IN_SECONDS;

export const TENANT_CONFIG_REVALIDATE_SECONDS = ONE_DAY_IN_SECONDS;
