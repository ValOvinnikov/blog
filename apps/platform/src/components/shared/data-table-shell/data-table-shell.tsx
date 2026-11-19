import { Card } from '@platform/components/shared/card';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@platform/lib/react';
import type { TMaybeUndefined } from '@shinefold/config';
import { hasLength } from '@shinefold/utils/primitives';
import type { ElementType, ReactElement, ReactNode } from 'react';

import { DataTableShellCell } from './components/cell/data-table-shell-cell';
import {
  DataTableShellHeadCell,
  type TDataTableShellColumnSort,
} from './components/head-cell/data-table-shell-head-cell';
import { DataTableShellNote } from './components/note/data-table-shell-note';
import { DataTableShellRow } from './components/row/data-table-shell-row';
import {
  DataTableShellTitle,
  type TDataTableShellTitleProps,
} from './components/title/data-table-shell-title';
import { DataTableShellToolbar } from './components/toolbar/data-table-shell-toolbar';
import { dataTableShellVariants } from './data-table-shell-variants';

const DataTableShellSlots = {
  Title: DataTableShellTitle,
  Toolbar: DataTableShellToolbar,
  Note: DataTableShellNote,
} satisfies Record<string, ElementType>;

const DataTableShellParts = {
  ...DataTableShellSlots,
  Row: DataTableShellRow,
  Cell: DataTableShellCell,
} satisfies Record<string, ElementType>;

type TDataTableShellColumn = {
  key: string;
  label: ReactNode;
  sort?: TDataTableShellColumnSort;
  width?: string;
};

type TDataTableShellProps<TItem> = {
  items: TItem[];
  emptyMessage: string;
  ariaLabel: string;
  columns: TDataTableShellColumn[];
  renderRow: (item: TItem) => ReactNode;
  isStacked?: boolean;
  children?: TCompoundChildren<typeof DataTableShellSlots>;
};

const DataTableShellRoot = <TItem,>({
  items,
  emptyMessage,
  ariaLabel,
  columns,
  renderRow,
  isStacked = false,
  children,
}: TDataTableShellProps<TItem>) => {
  const hasWidths = columns.some(({ width }) => width);
  const { card, scrollRegion, table, thead, tbody, empty } =
    dataTableShellVariants({
      isStacked,
      hasWidths,
    });
  const { slots } = mapCompoundSlots(children, DataTableShellSlots);
  const title = slots.Title as TMaybeUndefined<
    ReactElement<TDataTableShellTitleProps>
  >;

  return (
    <Card className={card()} aria-labelledby={title?.props.id}>
      <>
        {title}
        {slots.Toolbar}
        {hasLength(items) ? (
          // Focusable so Safari, which skips scroll containers, can scroll it by keyboard.
          <div
            className={scrollRegion()}
            role="region"
            aria-label={ariaLabel}
            tabIndex={0}
          >
            <table className={table()} data-stacked={isStacked || undefined}>
              {hasWidths && (
                <colgroup>
                  {columns.map(({ key, width }) => (
                    <col key={key} style={{ width }} />
                  ))}
                </colgroup>
              )}
              <thead className={thead()}>
                <tr>
                  {columns.map(({ key, label, sort }) => (
                    <DataTableShellHeadCell
                      key={key}
                      label={label}
                      sort={sort}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className={tbody()}>{items.map(renderRow)}</tbody>
            </table>
          </div>
        ) : (
          <p className={empty()}>{emptyMessage}</p>
        )}
        {slots.Note}
      </>
    </Card>
  );
};

export const DataTableShell: TCompoundComponent<
  typeof DataTableShellRoot,
  typeof DataTableShellParts
> = Object.assign(DataTableShellRoot, DataTableShellParts);
