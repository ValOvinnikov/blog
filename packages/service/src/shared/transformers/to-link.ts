import type { ILink } from '@blog/config';
import type { InferFragmentType } from 'groqd';

import type { linkFragment } from '#/shared/fragments/link';

export type TRawLink = InferFragmentType<typeof linkFragment>;

function toInternalHref(raw: NonNullable<TRawLink['internalReference']>) {
  if (!raw.slug) return undefined;

  switch (raw._type) {
    case 'post':
      return `/blog/${raw.slug}`;
    case 'category':
      return `/category/${raw.slug}`;
    case 'page':
      return `/${raw.slug}`;
    default:
      return undefined;
  }
}

export function toLink(raw: TRawLink | null | undefined): ILink | undefined {
  if (!raw) return undefined;

  const href =
    raw.linkType === 'internal' && raw.internalReference
      ? toInternalHref(raw.internalReference)
      : raw.url;

  if (!href) return undefined;

  return {
    label: raw.label,
    href,
    target:
      raw.linkType === 'external' && raw.openInNewTab ? '_blank' : undefined,
    platform: raw.platform ?? undefined,
  };
}
