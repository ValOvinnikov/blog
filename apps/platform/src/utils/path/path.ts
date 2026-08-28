// Studio-hostname slug only (`studio-<slug>.valstack.dev`) — the platform
// has no public subdomain scheme (custom domains only), so this never
// becomes part of the tenant's own site address.
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

export const DOMAIN_PATTERN =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
