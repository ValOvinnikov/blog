import type { TSanityProjectRef } from './image';

/**
 * The `sanity-image` package's own `baseUrl` prop format, as an alternative
 * to passing it separate `projectId`/`dataset` props.
 */
export function getSanityImageBaseUrl(project: TSanityProjectRef): string {
  return `https://cdn.sanity.io/images/${project.projectId}/${project.dataset}/`;
}
