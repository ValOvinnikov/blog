/**
 * Maps a Sanity document `_type` to the ISR tags that must be revalidated
 * when a document of that type is published/unpublished.
 *
 * The tag strings here are the exact literals passed to `isr(...)` in
 * `@blog/service` loaders — they predate a `{group}_{name}` rename of
 * document `_type`s, so a handful of tags don't match their document's
 * current `_type` (e.g. the `page_home` document invalidates the
 * `homePage` tag). Keep this table in sync with `packages/service/src`
 * if either side changes.
 */
const REVALIDATE_TAGS_BY_TYPE: Record<string, (id: string) => string[]> = {
  blog_post: () => ['post', 'posts', 'homePage'],
  blog_author: () => ['author', 'posts'],
  blog_category: () => ['category', 'categories', 'posts'],
  settings_site: () => ['site-settings'],
  settings_navigation: () => ['navigation'],
  settings_footer: () => ['footer'],
  page_home: () => ['homePage'],
  page_generic: () => ['page_generic'],
  module_hero: (id) => ['modules:hero', `module:${id}`],
  module_postList: (id) => ['modules:postList', `module:${id}`],
  module_content: (id) => ['modules:content', `module:${id}`],
  module_cta: (id) => ['modules:cta', `module:${id}`],
};

/**
 * Resolves the ISR tags affected by a change to a document of the given
 * `_type`. Unknown types resolve to an empty list.
 *
 * @example
 * getRevalidateTagsForType('blog_post', 'post-123') // ['post', 'posts', 'homePage']
 */
export function getRevalidateTagsForType(type: string, id: string): string[] {
  const resolveTags = REVALIDATE_TAGS_BY_TYPE[type];
  return resolveTags ? resolveTags(id) : [];
}
