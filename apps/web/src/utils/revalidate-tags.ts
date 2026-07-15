import type { AllSanitySchemaTypes } from '@blog/config';

/** Every document/object `_type` string the generated schema defines. */
type TSanityType = Extract<AllSanitySchemaTypes, { _type: string }>['_type'];

/**
 * Base ISR tags to revalidate per Sanity document `_type`, for the revalidation
 * webhook. Module types additionally purge a per-document `module:<id>` tag
 * (appended in the resolver).
 *
 * Keyed by the generated schema `_type` union via `satisfies` — renaming a
 * document `_type` in the CMS becomes a **compile error** here, so this table
 * can't silently drift from the schema. The tag strings themselves are the
 * literals passed to `isr(...)` in `@blog/service` loaders (a few predate a
 * `{group}_{name}` rename, e.g. the `page_home` document invalidates the
 * `homePage` tag) — keep them in sync with `packages/service/src`.
 */
const REVALIDATE_TAGS = {
  blog_post: ['post', 'posts', 'homePage'],
  blog_author: ['author', 'posts'],
  blog_category: ['category', 'categories', 'posts'],
  settings_site: ['site-settings'],
  settings_navigation: ['navigation'],
  settings_footer: ['footer'],
  page_home: ['homePage'],
  page_blog: ['page_blog'],
  page_generic: ['page_generic'],
  module_hero: ['modules:hero'],
  module_postList: ['modules:postList'],
  module_content: ['modules:content'],
  module_cta: ['modules:cta'],
} as const satisfies Partial<Record<TSanityType, readonly string[]>>;

/**
 * Resolves the ISR tags affected by a change to a document of the given
 * `_type`. Unknown types resolve to an empty list.
 *
 * The `Object.hasOwn` guard means the user-controlled `type` (from the webhook
 * body) can only ever hit a registered own key — never fall through to an
 * `Object.prototype` member — and the value read is plain data, never an
 * invoked function (CodeQL `js/unvalidated-dynamic-method-call`).
 *
 * @example
 * getRevalidateTagsForType('blog_post', 'post-123') // ['post', 'posts', 'homePage']
 */
export function getRevalidateTagsForType(type: string, id: string): string[] {
  if (!Object.hasOwn(REVALIDATE_TAGS, type)) return [];

  const tags: string[] = [
    ...REVALIDATE_TAGS[type as keyof typeof REVALIDATE_TAGS],
  ];
  if (type.startsWith('module_')) tags.push(`module:${id}`);
  return tags;
}
