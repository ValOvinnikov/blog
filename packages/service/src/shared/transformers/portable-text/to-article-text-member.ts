import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type ArticleText,
  type IBodyImageBlock,
  type TMaybeUndefined,
  type TPortableTextBlock,
} from '@blog/config';
import type { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text/portable-text-body-item';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import { toPortableText } from '@blog/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { InferFragmentType } from 'groqd';

type TRawBodyItem = InferFragmentType<typeof portableTextBodyItemFragment>;

export type TRawExpandableSectionBlock = Extract<
  TRawBodyItem,
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION }
>;

export type TRawArticleTextMember =
  | Exclude<
      TRawBodyItem,
      { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION }
    >
  | NonNullable<TRawExpandableSectionBlock['body']>[number];

type TRawBodyImageBlock = Extract<
  TRawArticleTextMember,
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE }
>;
type TRawAsideBlock = Extract<
  TRawArticleTextMember,
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.ASIDE }
>;
type TRawCookieListBlock = Extract<
  TRawArticleTextMember,
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST }
>;

type TCodeBlock = Extract<ArticleText[number], { _type: 'code' }>;

type TCookieListBlock = Pick<TRawCookieListBlock, '_type' | '_key'>;

type TResolvedAsideBlock = Omit<TRawAsideBlock, 'body'> & {
  body: TMaybeUndefined<TPortableTextBlock[]>;
};

export type TArticleTextMember =
  | TPortableTextBlock
  | IBodyImageBlock
  | TCodeBlock
  | TResolvedAsideBlock
  | TCookieListBlock;

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

function toCookieListBlock({
  _type,
  _key,
}: TRawCookieListBlock): TCookieListBlock {
  return { _type, _key };
}

export function toArticleTextMember(
  block: TRawArticleTextMember,
): TArticleTextMember {
  switch (block._type) {
    case PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE:
      return toBodyImageBlock(block);
    case PORTABLE_TEXT_BLOCK_TYPE.ASIDE:
      return toAsideBlock(block);
    case PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST:
      return toCookieListBlock(block);
    case 'block':
      return toPortableText(block);
    default:
      return block as TCodeBlock;
  }
}
