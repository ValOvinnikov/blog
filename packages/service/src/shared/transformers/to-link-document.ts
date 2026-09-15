import {
  routes,
  LINK_TYPE,
  type ILink,
  type TMaybeUndefined,
} from '@blog/config';
import type { linkDocumentFragment } from '@blog/service/shared/fragments/link-document';
import type { InferFragmentType } from 'groqd';

export type TRawLinkDocument = InferFragmentType<typeof linkDocumentFragment>;

type TInternalLinkDocument = Extract<
  TRawLinkDocument,
  { internalReference: unknown }
>;
type TInternalReference = NonNullable<
  TInternalLinkDocument['internalReference']
>;

const INTERNAL_HREF_BUILDERS: Record<
  TInternalReference['_type'],
  (slug: string | null) => TMaybeUndefined<string>
> = {
  page_home: () => routes.home(),
  page_landing: (slug) => (slug ? routes.landingPage(slug) : undefined),
  page_post: (slug) => (slug ? routes.post(slug) : undefined),
  page_postIndex: () => routes.blogIndex(),
  page_topic: (slug) => (slug ? routes.topic(slug) : undefined),
  page_topicIndex: () => routes.topics(),
  page_tag: (slug) => (slug ? routes.tag(slug) : undefined),
  page_tagIndex: () => routes.tags(),
};

function toInternalHref(raw: TInternalReference): TMaybeUndefined<string> {
  const build = INTERNAL_HREF_BUILDERS[raw._type];
  return build?.(raw.slug);
}

/** Resolves a `link` document's raw query result to a renderable `ILink`. */
export function toLinkDocument(
  raw: TRawLinkDocument | null | undefined,
): TMaybeUndefined<ILink> {
  if (!raw) return undefined;

  const href =
    'internalReference' in raw
      ? raw.internalReference && toInternalHref(raw.internalReference)
      : raw.url;

  if (!href) return undefined;

  return {
    label: raw.label,
    href,
    target:
      raw.linkType === LINK_TYPE.EXTERNAL && raw.openInNewTab
        ? '_blank'
        : undefined,
    platform: undefined,
    ariaLabel: undefined,
  };
}
