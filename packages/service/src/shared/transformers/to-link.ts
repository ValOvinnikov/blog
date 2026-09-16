import {
  routes,
  LINK_TYPE,
  type ILink,
  type TMaybeUndefined,
} from '@blog/config';
import type { linkFragment } from '@blog/service/shared/fragments/link';
import type { InferFragmentType } from 'groqd';

export type TRawLink = InferFragmentType<typeof linkFragment>;

type TInternalReference = NonNullable<TRawLink['internalReference']>;

// Keyed by the generated document `_type` union so removing a target from the schema fails this object literal at compile time.
const INTERNAL_HREF_BUILDERS: Record<
  TInternalReference['_type'],
  (slug: string | null) => TMaybeUndefined<string>
> = {
  page_post: (slug) => (slug ? routes.post(slug) : undefined),
  blog_topic: (slug) => (slug ? routes.topic(slug) : undefined),
  page_landing: (slug) => (slug ? routes.landingPage(slug) : undefined),
  page_postIndex: () => routes.blogIndex(),
};

function toInternalHref(raw: TInternalReference): TMaybeUndefined<string> {
  // `_type` reflects the reference union but comes from Sanity at runtime, so an unmatched target returns undefined rather than crashing.
  const build = INTERNAL_HREF_BUILDERS[raw._type];
  return build?.(raw.slug);
}

export function toLink(
  raw: TRawLink | null | undefined,
): TMaybeUndefined<ILink> {
  if (!raw) return undefined;

  const href =
    raw.linkType === LINK_TYPE.INTERNAL && raw.internalReference
      ? toInternalHref(raw.internalReference)
      : raw.url;

  if (!href) return undefined;

  return {
    label: raw.label,
    href,
    target:
      raw.linkType === LINK_TYPE.EXTERNAL && raw.openInNewTab
        ? '_blank'
        : undefined,
    platform: raw.platform ?? undefined,
    ariaLabel: raw.accessibleLabel ?? undefined,
  };
}
