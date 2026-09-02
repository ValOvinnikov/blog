import type { TImageTenant } from './image';

/**
 * The `sanity-image` package's own `baseUrl` prop format, as an alternative
 * to passing it separate `projectId`/`dataset` props.
 */
export function getSanityImageBaseUrl(tenant: TImageTenant): string {
  return `https://cdn.sanity.io/images/${tenant.projectId}/${tenant.dataset}/`;
}
