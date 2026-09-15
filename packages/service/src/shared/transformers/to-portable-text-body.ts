import type {
  IBodyImageBlock,
  ProseText,
  RichText,
  TMaybeUndefined,
} from '@blog/config';
import type { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text-body';
import {
  toPortableTextBlockWithResolvedLinks,
  type TPortableTextBlockWithResolvedLinks,
} from '@blog/service/shared/transformers/to-portable-text-mark-def';
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
type TRawTextBlock = Extract<TRawPortableTextBody[number], { _type: 'block' }>;

export type TResolvedAsideBlock = Omit<TRawAsideBlock, 'body'> & {
  body: TMaybeUndefined<
    Array<TPortableTextBlockWithResolvedLinks<ProseText[number]>>
  >;
};

export type TPortableTextBody = Array<
  | TPortableTextBlockWithResolvedLinks<TRawTextBlock>
  | IBodyImageBlock
  | Extract<RichText[number], { _type: 'code' }>
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
    body: raw.body?.map(toPortableTextBlockWithResolvedLinks) ?? undefined,
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
        return toPortableTextBlockWithResolvedLinks(block);
      default:
        // `code` is the only block type `portableTextBodyItemFragment` leaves
        // unhandled, so it's the only one `conditionalByType` narrows down to
        // `{ _type }` in the static type — safe to assert back to its real shape.
        return block as Extract<RichText[number], { _type: 'code' }>;
    }
  });
}
