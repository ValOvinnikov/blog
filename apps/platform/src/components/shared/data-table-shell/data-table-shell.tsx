import { Card } from '@platform/components/shared/card';
import { ARIA_ROLE } from '@platform/constants/aria-role';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@platform/lib/react';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TValueOf } from '@shinefold/config/utils';
import { hasLength } from '@shinefold/utils/primitives';
import type { ElementType, ReactElement, ReactNode } from 'react';

import { DataTableShellCell } from './components/cell/data-table-shell-cell';
import { DataTableShellFooter } from './components/footer/data-table-shell-footer';
import {
  DataTableShellHeadCell,
  type TDataTableShellColumnSort,
} from './components/head-cell/data-table-shell-head-cell';
import { DataTableShellNote } from './components/note/data-table-shell-note';
import { DataTableShellRow } from './components/row/data-table-shell-row';
import { DataTableShellStackedProvider } from './components/stacked-provider/data-table-shell-stacked-provider';
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
  Footer: DataTableShellFooter,
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
  width?: `${number}px` | `${number}%`;
  isLabelHidden?: boolean;
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
  const { card, scrollRegion, table, thead, tbody, empty, visuallyHidden } =
    dataTableShellVariants({
      isStacked,
      hasWidths,
    });
  const headLabel = ({ label, isLabelHidden }: TDataTableShellColumn) =>
    isLabelHidden ? <span className={visuallyHidden()}>{label}</span> : label;
  const { slots } = mapCompoundSlots(children, DataTableShellSlots);
  const stackedLabels = isStacked
    ? Object.fromEntries(
        columns.map((column) => [column.key, headLabel(column)]),
      )
    : undefined;
  const stackedRole = (role: TValueOf<typeof ARIA_ROLE>) =>
    isStacked ? role : undefined;
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
            role={ARIA_ROLE.REGION}
            aria-label={ariaLabel}
            tabIndex={0}
          >
            <table
              className={table()}
              role={stackedRole(ARIA_ROLE.TABLE)}
              data-stacked={isStacked || undefined}
              data-has-widths={hasWidths || undefined}
            >
              {hasWidths && (
                <colgroup>
                  {columns.map(({ key, width }) => (
                    <col key={key} style={{ width }} />
                  ))}
                </colgroup>
              )}
              <thead className={thead()} role={stackedRole(ARIA_ROLE.ROWGROUP)}>
                <tr>
                  {columns.map((column) => (
                    <DataTableShellHeadCell
                      key={column.key}
                      label={headLabel(column)}
                      sort={column.sort}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className={tbody()} role={stackedRole(ARIA_ROLE.ROWGROUP)}>
                <DataTableShellStackedProvider labels={stackedLabels}>
                  {items.map(renderRow)}
                </DataTableShellStackedProvider>
              </tbody>
            </table>
          </div>
        ) : (
          <p className={empty()}>{emptyMessage}</p>
        )}
        {slots.Note}
        {slots.Footer}
      </>
    </Card>
  );
};

export const DataTableShell: TCompoundComponent<
  typeof DataTableShellRoot,
  typeof DataTableShellParts
> = Object.assign(DataTableShellRoot, DataTableShellParts);
