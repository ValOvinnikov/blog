import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type ArticleText,
  type IBodyImageBlock,
  type TMaybeUndefined,
  type TPortableTextBlock,
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
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE }
>;
type TRawAsideBlock = Extract<
  TRawPortableTextBody[number],
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.ASIDE }
>;

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
    _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
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
      case PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE:
        return toBodyImageBlock(block);
      case PORTABLE_TEXT_BLOCK_TYPE.ASIDE:
        return toAsideBlock(block);
      case 'block':
        return toPortableText(block);
      default:
        return block as Extract<ArticleText[number], { _type: 'code' }>;
    }
  });
}
