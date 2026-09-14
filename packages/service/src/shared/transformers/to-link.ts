import {
  routes,
  LINK_TYPE,
  type ILink,
  type TMaybeUndefined,
} from '@blog/config';
import type {
  linkRefFragment,
  sharedLinkFragment,
} from '@blog/service/shared/fragments/link';
import type { InferFragmentType } from 'groqd';

export type TRawSharedLink = InferFragmentType<typeof sharedLinkFragment>;

type TInternalReference = NonNullable<TRawSharedLink['internalReference']>;

// Keyed by the generated document `_type` union rather than a hand-typed
// switch: renaming/removing one of these types in the schema
// (`shared_link.ts`'s `internalReference.to: [...]`) fails this object
// literal at compile time instead of leaving a silently-dead case branch.
// `page_postIndex` is a slug-less singleton, so its builder ignores the slug
// argument and always resolves to `/blog`; the other three return
// `undefined` when the slug is genuinely missing (bad data) rather than
// building a broken href.
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
  // `_type` is typed as the reference union, but it comes from Sanity at
  // runtime and could fall outside it (unexpected reference target / schema
  // drift) — return undefined rather than crash, mirroring the old switch's
  // `default`. The Record stays exhaustive so adding a schema type is a
  // compile error here.
  const build = INTERNAL_HREF_BUILDERS[raw._type];
  return build?.(raw.slug);
}

export type TRawLinkRef = InferFragmentType<typeof linkRefFragment>;

// A looser shape than `TRawLinkRef` — `labelOverride` is optional here so a
// `sharedLinkAnnotation` markDef (which has no `labelOverride` field at
// all) can resolve through the same function as `linkRef`/`socialLinkRef`/
// `ctaActionRef`, which all carry it.
type TLinkResolvable = {
  labelOverride?: string | null;
  link: TRawSharedLink | null;
};

/**
 * Resolves any `linkRef`-shaped wrapper (`linkRef`, `socialLinkRef`,
 * `ctaActionRef`, `sharedLinkAnnotation`) to a view-model `ILink` —
 * undefined when the underlying `shared_link` is a dangling reference or
 * resolves to no usable href.
 */
export function toLink(
  raw: TLinkResolvable | null | undefined,
): TMaybeUndefined<ILink> {
  if (!raw?.link) return undefined;

  const { link } = raw;

  const href =
    link.linkType === LINK_TYPE.INTERNAL && link.internalReference
      ? toInternalHref(link.internalReference)
      : (link.url ?? undefined);

  if (!href) return undefined;

  return {
    label: raw.labelOverride ?? link.label,
    href,
    target:
      link.linkType === LINK_TYPE.EXTERNAL && link.openInNewTab
        ? '_blank'
        : undefined,
    platform: undefined,
  };
}
