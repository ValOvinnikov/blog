import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type TMaybeUndefined,
  type TPortableTextBlock,
} from '@blog/config';
import {
  toArticleTextMember,
  type TArticleTextMember,
  type TRawArticleTextMember,
  type TRawExpandableSectionBlock,
  type TRawTableBlock,
} from '@blog/service/shared/transformers/portable-text/to-article-text-member';
import { toPortableText } from '@blog/service/shared/transformers/portable-text/to-portable-text-mark-def';

export type TRawPortableTextBody = Array<
  TRawArticleTextMember | TRawExpandableSectionBlock | TRawTableBlock
>;

type TRawTableRow = NonNullable<TRawTableBlock['rows']>[number];
type TRawTableCell = NonNullable<TRawTableRow['cells']>[number];

type TResolvedTableCell = Omit<TRawTableCell, 'value'> & {
  value: TMaybeUndefined<TPortableTextBlock[]>;
};

type TResolvedTableRow = Omit<TRawTableRow, 'cells'> & {
  cells: TMaybeUndefined<TResolvedTableCell[]>;
};

type TResolvedTableBlock = Omit<TRawTableBlock, 'rows'> & {
  rows: TMaybeUndefined<TResolvedTableRow[]>;
};

type TResolvedExpandableSectionBlock = Omit<
  TRawExpandableSectionBlock,
  'body'
> & {
  body: TMaybeUndefined<TArticleTextMember[]>;
};

export type TPortableTextBody = Array<
  TArticleTextMember | TResolvedExpandableSectionBlock | TResolvedTableBlock
>;

function toExpandableSectionBlock(
  raw: TRawExpandableSectionBlock,
): TResolvedExpandableSectionBlock {
  return {
    ...raw,
    body: raw.body?.map(toArticleTextMember) ?? undefined,
  };
}

function toTableCell(raw: TRawTableCell): TResolvedTableCell {
  return {
    ...raw,
    value: raw.value?.map(toPortableText) ?? undefined,
  };
}

function toTableRow(raw: TRawTableRow): TResolvedTableRow {
  return {
    ...raw,
    cells: raw.cells?.map(toTableCell) ?? undefined,
  };
}

function toTableBlock(raw: TRawTableBlock): TResolvedTableBlock {
  return {
    ...raw,
    rows: raw.rows?.map(toTableRow) ?? undefined,
  };
}

export function toPortableTextBody(
  raw: TRawPortableTextBody,
): TPortableTextBody {
  return raw.map((block) => {
    switch (block._type) {
      case PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION:
        return toExpandableSectionBlock(block);
      case PORTABLE_TEXT_BLOCK_TYPE.TABLE:
        return toTableBlock(block);
      default:
        return toArticleTextMember(block);
    }
  });
}
