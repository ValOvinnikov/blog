import { TLINK_TYPE, type ILink } from '@blog/config';
import type { linkFragment } from '@blog/service/shared/fragments/link';
import type { InferFragmentType } from 'groqd';

export type TRawLink = InferFragmentType<typeof linkFragment>;

type TInternalReference = NonNullable<TRawLink['internalReference']>;

// Keyed by the generated document `_type` union rather than a hand-typed
// switch: renaming/removing one of these types in the schema (link.ts's
// `to: [...]`) fails this object literal at compile time instead of leaving
// a silently-dead case branch.
const INTERNAL_HREF_BUILDERS: Record<
  TInternalReference['_type'],
  (slug: string) => string
> = {
  blog_post: (slug) => `/blog/${slug}`,
  blog_category: (slug) => `/category/${slug}`,
  page_generic: (slug) => `/${slug}`,
};

function toInternalHref(raw: TInternalReference): string | undefined {
  if (!raw.slug) return undefined;

  // `_type` is typed as the reference union, but it comes from Sanity at
  // runtime and could fall outside it (unexpected reference target / schema
  // drift) — return undefined rather than crash, mirroring the old switch's
  // `default`. The Record stays exhaustive so adding a schema type is a
  // compile error here.
  const build: ((slug: string) => string) | undefined =
    INTERNAL_HREF_BUILDERS[raw._type];
  return build?.(raw.slug);
}

export function toLink(raw: TRawLink | null | undefined): ILink | undefined {
  if (!raw) return undefined;

  const href =
    raw.linkType === TLINK_TYPE.INTERNAL && raw.internalReference
      ? toInternalHref(raw.internalReference)
      : raw.url;

  if (!href) return undefined;

  return {
    label: raw.label,
    href,
    target:
      raw.linkType === TLINK_TYPE.EXTERNAL && raw.openInNewTab
        ? '_blank'
        : undefined,
    platform: raw.platform ?? undefined,
  };
}
