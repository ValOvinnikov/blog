import type { IWithClassName, IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { type ElementType, Fragment } from 'react';

import { TableCaption } from './components/caption/table-caption';
import { TableCell } from './components/cell/table-cell';
import { TableHead } from './components/head/table-head';
import { TableHeaderCell } from './components/header-cell/table-header-cell';
import { TableRow } from './components/row/table-row';
import { tableVariants } from './table-variants';

const TableSlotParts = {
  Caption: TableCaption,
  Head: TableHead,
} satisfies Record<string, ElementType>;

const TableParts = {
  ...TableSlotParts,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
} satisfies Record<string, ElementType>;

type TTableChildren = TCompoundChildren<
  Pick<typeof TableParts, 'Caption' | 'Head' | 'Row'>
>;

export type TTableProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel: string;
    children?: TTableChildren | TTableChildren[];
  };

const s = tableVariants();

/** A data table that scrolls sideways inside its own focusable region when it is wider than the screen. */
const TableRoot = ({
  ariaLabel,
  children,
  className,
  dataTestId,
}: TTableProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, TableSlotParts);

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      className={s.region({ class: className })}
      data-testid={dataTestId}
    >
      <table className={s.table()}>
        {slots.Caption}
        {slots.Head}
        <tbody>
          {unmatched.map((node, i) => (
            <Fragment key={i}>{node}</Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Table: TCompoundComponent<typeof TableRoot, typeof TableParts> =
  Object.assign(TableRoot, TableParts);
