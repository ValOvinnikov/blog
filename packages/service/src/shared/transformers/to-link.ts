import { TLINK_TYPE, type ILink } from '@blog/config';
import type { linkFragment } from '@blog/service/shared/fragments/link';
import type { InferFragmentType } from 'groqd';

export type TRawLink = InferFragmentType<typeof linkFragment>;

function toInternalHref(raw: NonNullable<TRawLink['internalReference']>) {
  if (!raw.slug) return undefined;

  switch (raw._type) {
    case 'blog_post':
      return `/blog/${raw.slug}`;
    case 'blog_category':
      return `/category/${raw.slug}`;
    case 'page_generic':
      return `/${raw.slug}`;
    default:
      return undefined;
  }
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
