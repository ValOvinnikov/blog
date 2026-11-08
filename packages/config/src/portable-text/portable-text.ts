import type { ILink } from '@blog/config/client/objects';
import type { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants/portable-text-block-type';
import type { TMaybeUndefined } from '@blog/config/types';
import type {
  PortableTextBlock,
  PortableTextMarkDefinition,
  PortableTextSpan,
} from '@portabletext/types';

export type TPortableTextLink = Pick<ILink, 'href' | 'target'>;

export interface IPortableTextLinkMark extends PortableTextMarkDefinition {
  _type: typeof PORTABLE_TEXT_BLOCK_TYPE.LINK_REF;
  link: TMaybeUndefined<TPortableTextLink>;
}

export interface IPortableTextCookiePreferencesMark extends PortableTextMarkDefinition {
  _type: typeof PORTABLE_TEXT_BLOCK_TYPE.COOKIE_PREFERENCES_LINK;
}

export type TPortableTextMark =
  IPortableTextLinkMark | IPortableTextCookiePreferencesMark;

export type TPortableTextBlock = PortableTextBlock<
  TPortableTextMark,
  PortableTextSpan
> & { _type: 'block'; _key: string };
