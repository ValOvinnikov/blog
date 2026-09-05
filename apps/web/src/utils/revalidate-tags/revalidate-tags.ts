import type { AllSanitySchemaTypes, TModuleType } from '@blog/config';

/** Every document/object `_type` string the generated schema defines. */
type TSanityType = Extract<AllSanitySchemaTypes, { _type: string }>['_type'];

/**
 * Every non-module document `_type` that at least one `@blog/service` loader's
 * `isr(...)` call actually depends on. Kept in sync by hand against
 * `packages/service/src` — required (like `TModuleType`) so a removed or
 * typo'd entry fails `type-check` instead of silently purging nothing.
 *
 * The opposite mistake — a brand-new `isr(...)` tag with no matching value
 * below — is caught separately by `pnpm check:revalidate-tags-sync`
 * (`scripts/check-revalidate-tags-sync.mjs`), which extracts every tag
 * literal passed to `isr(...)` across `packages/service/src` and fails if
 * one is absent from this map's value union.
 *
 * `settings_voice` is deliberately excluded: audited via
 * `grep -rln "voice" packages/service/src` (excluding tests) with zero hits —
 * it's Sanity Studio-only config, read by nothing that caches, so it
 * correctly has no entry below.
 */
type TCachedDocumentType =
  | 'page_tag'
  | 'page_topic'
  | 'page_tagIndex'
  | 'page_topicIndex'
  | 'page_blog'
  | 'page_generic'
  | 'page_post'
  | 'page_home'
  | 'blog_post'
  | 'blog_author'
  | 'blog_topic'
  | 'blog_tag'
  | 'settings_site'
  | 'settings_navigation'
  | 'settings_footer'
  | 'settings_newsletter'
  | 'settings_theme';

/**
 * Base ISR tags to revalidate per Sanity document `_type`, for the revalidation
 * webhook. Module types additionally purge a per-document `module:<id>` tag
 * (appended in the resolver).
 *
 * The `satisfies` clause requires both `TModuleType` and `TCachedDocumentType`
 * (`Record<TModuleType | TCachedDocumentType, …>`), so a schema addition to
 * either union without a matching entry here fails `type-check` —
 * regardless of whether that module type is ever added to `MODULE_MAP`
 * (`module_hero`, `module_postList`, and `module_taxonomyList` never are).
 * Every other document/object `_type` stays `Partial`, since it legitimately
 * purges nothing. The tag strings themselves are the literals passed to
 * `isr(...)` in `@blog/service` loaders (a few predate a `{group}_{name}`
 * rename, e.g. the `page_home` document invalidates the `homePage` tag) —
 * keep them in sync with `packages/service/src`.
 */
const REVALIDATE_TAGS = {
  blog_post: ['post', 'posts', 'homePage'],
  blog_author: ['author', 'posts'],
  blog_topic: ['topic', 'topics', 'posts'],
  blog_tag: ['tag', 'tags', 'posts'],
  settings_site: ['site-settings'],
  settings_navigation: ['navigation'],
  settings_footer: ['footer'],
  settings_newsletter: ['newsletter-settings'],
  settings_theme: ['theme-settings'],
  page_home: ['homePage'],
  page_blog: ['page_blog'],
  page_generic: ['page_generic'],
  page_post: ['page_post'],
  page_tag: ['page_tag'],
  page_topic: ['page_topic'],
  page_topicIndex: ['page_topicIndex'],
  page_tagIndex: ['page_tagIndex'],
  module_hero: ['modules:hero'],
  module_postList: ['modules:postList'],
  module_taxonomyList: ['modules:taxonomyList'],
  module_postLatest: ['modules:postLatest'],
  module_content: ['modules:content'],
  module_cta: ['modules:cta'],
  module_newsletter: ['modules:newsletter'],
} as const satisfies Record<
  TModuleType | TCachedDocumentType,
  readonly string[]
> &
  Partial<Record<TSanityType, readonly string[]>>;

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
export const getRevalidateTagsForType = (
  type: string,
  id: string,
): string[] => {
  if (!Object.hasOwn(REVALIDATE_TAGS, type)) return [];

  const tags: string[] = [
    ...REVALIDATE_TAGS[type as keyof typeof REVALIDATE_TAGS],
  ];
  if (type.startsWith('module_')) tags.push(`module:${id}`);
  return tags;
};
