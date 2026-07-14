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

function toInternalHref(raw: TInternalReference) {
  if (!raw.slug) return undefined;

  return INTERNAL_HREF_BUILDERS[raw._type](raw.slug);
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
