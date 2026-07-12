/**
 * Resolves the ISR tags affected by a change to a Sanity document of the given
 * `_type`, for the revalidation webhook. Unknown types resolve to an empty list.
 *
 * A `switch` (rather than a lookup table of functions) is deliberate: the
 * `type` comes from the webhook body, so selecting **and invoking** a function
 * by that value is a user-controlled dynamic dispatch (CodeQL
 * `js/unvalidated-dynamic-method-call`). Static `case` branches have no such
 * dispatch.
 *
 * The tag strings are the exact literals passed to `isr(...)` in `@blog/service`
 * loaders — they predate a `{group}_{name}` rename of document `_type`s, so a
 * few tags don't match their document's current `_type` (e.g. the `page_home`
 * document invalidates the `homePage` tag). Keep in sync with
 * `packages/service/src` if either side changes.
 *
 * @example
 * getRevalidateTagsForType('blog_post', 'post-123') // ['post', 'posts', 'homePage']
 */
export function getRevalidateTagsForType(type: string, id: string): string[] {
  switch (type) {
    case 'blog_post':
      return ['post', 'posts', 'homePage'];
    case 'blog_author':
      return ['author', 'posts'];
    case 'blog_category':
      return ['category', 'categories', 'posts'];
    case 'settings_site':
      return ['site-settings'];
    case 'settings_navigation':
      return ['navigation'];
    case 'settings_footer':
      return ['footer'];
    case 'page_home':
      return ['homePage'];
    case 'page_generic':
      return ['page_generic'];
    case 'module_hero':
      return ['modules:hero', `module:${id}`];
    case 'module_postList':
      return ['modules:postList', `module:${id}`];
    case 'module_content':
      return ['modules:content', `module:${id}`];
    case 'module_cta':
      return ['modules:cta', `module:${id}`];
    default:
      return [];
  }
}
