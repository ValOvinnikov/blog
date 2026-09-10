/**
 * Storybook-only stand-in for the real `TagsIndexBreadcrumbs`, which reads
 * the request tenant (via `@blog/db`) to build its base URL — no database
 * connection is available in Storybook (`.storybook/main.ts` aliases the
 * exact specifier to this module).
 */
export const TagsIndexBreadcrumbs = () => (
  <nav aria-label="Breadcrumb">Home / Tags</nav>
);
