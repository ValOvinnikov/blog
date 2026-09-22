import type {
  ArticleText,
  IBodyImageBlock,
  TMaybeUndefined,
  TPortableTextBlock,
} from '@blog/config';
import type { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text-body';
import { toPortableText } from '@blog/service/shared/transformers/to-portable-text-mark-def';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferFragmentType } from 'groqd';

export type TRawPortableTextBody = Array<
  InferFragmentType<typeof portableTextBodyItemFragment>
>;

type TRawBodyImageBlock = Extract<
  TRawPortableTextBody[number],
  { _type: 'bodyImage' }
>;
type TRawAsideBlock = Extract<TRawPortableTextBody[number], { _type: 'aside' }>;

type TResolvedAsideBlock = Omit<TRawAsideBlock, 'body'> & {
  body: TMaybeUndefined<TPortableTextBlock[]>;
};

export type TPortableTextBody = Array<
  | TPortableTextBlock
  | IBodyImageBlock
  | Extract<ArticleText[number], { _type: 'code' }>
  | TResolvedAsideBlock
>;

function toBodyImageBlock(raw: TRawBodyImageBlock): IBodyImageBlock {
  return {
    _type: 'bodyImage',
    _key: raw._key,
    layout: raw.layout ?? undefined,
    image: toSanityImage(raw),
  };
}

function toAsideBlock(raw: TRawAsideBlock): TResolvedAsideBlock {
  return {
    ...raw,
    body: raw.body?.map(toPortableText) ?? undefined,
  };
}

export function toPortableTextBody(
  raw: TRawPortableTextBody,
): TPortableTextBody {
  return raw.map((block) => {
    switch (block._type) {
      case 'bodyImage':
        return toBodyImageBlock(block);
      case 'aside':
        return toAsideBlock(block);
      case 'block':
        return toPortableText(block);
      default:
        return block as Extract<ArticleText[number], { _type: 'code' }>;
    }
  });
}
