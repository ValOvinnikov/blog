import type { ILink } from '@blog/config/client/objects';
import type { TMaybeUndefined } from '@blog/config/types';
import type {
  PortableTextBlock,
  PortableTextMarkDefinition,
  PortableTextSpan,
} from '@portabletext/types';

export type TPortableTextLink = Pick<ILink, 'href' | 'target'>;

export interface IPortableTextLinkMark extends PortableTextMarkDefinition {
  _type: 'linkRef';
  link: TMaybeUndefined<TPortableTextLink>;
}

export type TPortableText = PortableTextBlock<
  IPortableTextLinkMark,
  PortableTextSpan
> & { _type: 'block' };
