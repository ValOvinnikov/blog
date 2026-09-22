import {
  pageHref,
  LINK_TYPE,
  type ILink,
  type TMaybeUndefined,
} from '@blog/config';
import type { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';
import type { InferFragmentType } from 'groqd';

export type TRawLinkDocument = InferFragmentType<typeof linkDocumentFragment>;

export function toLinkDocument(
  raw: TRawLinkDocument | null | undefined,
): TMaybeUndefined<ILink> {
  if (!raw) return undefined;

  const href =
    raw.linkType === LINK_TYPE.INTERNAL
      ? raw.internalReference &&
        pageHref(raw.internalReference._type, raw.internalReference.slug)
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
