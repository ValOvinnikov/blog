import { PORTABLE_TEXT_BLOCK_TYPE, type TMaybeUndefined } from '@blog/config';
import {
  toArticleTextMember,
  type TArticleTextMember,
  type TRawArticleTextMember,
  type TRawExpandableSectionBlock,
} from '@blog/service/shared/transformers/portable-text/to-article-text-member';

export type TRawPortableTextBody = Array<
  TRawArticleTextMember | TRawExpandableSectionBlock
>;

type TResolvedExpandableSectionBlock = Omit<
  TRawExpandableSectionBlock,
  'body'
> & {
  body: TMaybeUndefined<TArticleTextMember[]>;
};

export type TPortableTextBody = Array<
  TArticleTextMember | TResolvedExpandableSectionBlock
>;

function toExpandableSectionBlock(
  raw: TRawExpandableSectionBlock,
): TResolvedExpandableSectionBlock {
  return {
    ...raw,
    body: raw.body?.map(toArticleTextMember) ?? undefined,
  };
}

export function toPortableTextBody(
  raw: TRawPortableTextBody,
): TPortableTextBody {
  return raw.map((block) =>
    block._type === PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION
      ? toExpandableSectionBlock(block)
      : toArticleTextMember(block),
  );
}
