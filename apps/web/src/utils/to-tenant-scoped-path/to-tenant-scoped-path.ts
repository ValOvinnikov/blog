/**
 * Prefixes an unprefixed `@blog/config` `routes.*` path with the tenant and
 * locale segments a resolved request actually carries — the only path shape
 * `revalidatePath` matches (an interpolated segment never matches the
 * bracketed route pattern Next derives its implicit layout tags from).
 */
export const toTenantScopedPath = (
  tenantId: string,
  locale: string,
  path: string,
): string => `/${tenantId}/${locale}${path === '/' ? '' : path}`;
