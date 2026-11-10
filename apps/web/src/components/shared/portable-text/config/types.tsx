import {
  ASIDE_KIND,
  IMAGE_LAYOUT,
  PORTABLE_TEXT_BLOCK_TYPE,
  type Code,
  type IBodyImageBlock,
  type TAsideKind,
} from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { ImageWithCaption } from '@blog/ui/components/molecules/image-with-caption';
import { Table } from '@blog/ui/components/molecules/table';
import { hasLength } from '@blog/utils/primitives';
import {
  PortableText as PortableTextRoot,
  type PortableTextReactComponents,
} from '@portabletext/react';
import { DeepAside } from '@web/components/shared/deep-aside';
import { CodeBlock } from '@web/components/shared/portable-text/components/code-block';
import { portableTextVariants } from '@web/components/shared/portable-text/portable-text-variants';
import { SanityImage } from '@web/components/shared/sanity-image';
import { useTranslations } from 'next-intl';

import { FULL_BLEED_DATA_ATTR } from './full-bleed';

const s = portableTextVariants();

export type TAsideKindLabels = Partial<Record<TAsideKind, string>>;

type TResolvedAsideBlock = Extract<
  TPortableTextBody[number],
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.ASIDE }
>;

type TResolvedTableBlock = Extract<
  TPortableTextBody[number],
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.TABLE }
>;

type TResolvedTableRow = NonNullable<TResolvedTableBlock['rows']>[number];

const renderBodyImage = (block: IBodyImageBlock) => {
  if (!block.image) return null;

  const image = (
    <ImageWithCaption layout={block.layout}>
      <SanityImage
        image={block.image}
        width={1200}
        sizes="(min-width: 1024px) 800px, 100vw"
        loading="lazy"
        className={s.image()}
      />
    </ImageWithCaption>
  );

  return block.layout === IMAGE_LAYOUT.FULL_BLEED ? (
    <div {...{ [FULL_BLEED_DATA_ATTR]: '' }}>{image}</div>
  ) : (
    image
  );
};

export const bodyImageTypeComponent = ({ value }: { value: IBodyImageBlock }) =>
  renderBodyImage(value);

export const codeTypeComponent = ({ value }: { value: Code }) => (
  <CodeBlock
    code={value.code ?? ''}
    language={value.language}
    filename={value.filename}
    highlightedLines={value.highlightedLines}
  />
);

export const makeAsideTypeComponent = (
  baseComponents: PortableTextReactComponents,
  asideKindLabels?: TAsideKindLabels,
) => {
  const AsideType = ({ value }: { value: TResolvedAsideBlock }) => {
    const kind = value.kind ?? ASIDE_KIND.CONTEXT;
    const label = asideKindLabels?.[kind] ?? kind;

    return (
      <DeepAside kind={kind} label={label}>
        <PortableTextRoot
          value={value.body ?? []}
          components={baseComponents}
        />
      </DeepAside>
    );
  };

  return AsideType;
};

export const makeTableTypeComponent = (
  cellComponents: PortableTextReactComponents,
) => {
  const renderRow = (row: TResolvedTableRow, isHeaderRow: boolean) => {
    const Cell = isHeaderRow ? Table.HeaderCell : Table.Cell;

    return (
      <Table.Row key={row._key}>
        {row.cells?.map((cell) => (
          <Cell key={cell._key}>
            <PortableTextRoot
              value={cell.value ?? []}
              components={cellComponents}
            />
          </Cell>
        ))}
      </Table.Row>
    );
  };

  const TableType = ({ value }: { value: TResolvedTableBlock }) => {
    const t = useTranslations(PORTABLE_TEXT_BLOCK_TYPE.TABLE);
    const rows = value.rows ?? [];
    const headerRowCount = value.headerRows ?? 0;
    const headerRows = rows.slice(0, headerRowCount);
    const bodyRows = rows.slice(headerRowCount);

    return (
      <div {...{ [FULL_BLEED_DATA_ATTR]: '' }} className={s.table()}>
        <Table ariaLabel={t('regionLabel')}>
          {hasLength(headerRows) && (
            <Table.Head>
              {headerRows.map((row) => renderRow(row, true))}
            </Table.Head>
          )}
          {bodyRows.map((row) => renderRow(row, false))}
        </Table>
      </div>
    );
  };

  return TableType;
};
