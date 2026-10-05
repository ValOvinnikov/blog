import type { TSanityProjectRef } from '@blog/service/sanity/project-cache/project-cache';

/** The `sanity-image` package's `baseUrl` prop, an alternative to separate `projectId`/`dataset` props. */
export function getSanityImageBaseUrl(project: TSanityProjectRef): string {
  return `https://cdn.sanity.io/images/${project.projectId}/${project.dataset}/`;
}
