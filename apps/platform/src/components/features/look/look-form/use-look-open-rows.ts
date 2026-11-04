import type { TMaybeNull } from '@blog/config';
import type { TAccordionActions } from '@platform/components/shared/accordion';
import type { TLookRow } from '@platform/constants/look-row';
import {
  nextOpenRows,
  revealOpenRow,
} from '@platform/utils/look-open-rows/look-open-rows';
import { useRef, useState, type RefCallback } from 'react';

type TLookRowActions = TAccordionActions<TLookRow>;

export type TLookRowsGroup = {
  openValues: readonly TLookRow[];
  onOpenValuesChange: (values: TLookRow[]) => void;
  actionsRef: RefCallback<TLookRowActions>;
};

export const useLookOpenRows = () => {
  const [openRows, setOpenRows] = useState<readonly TLookRow[]>([]);
  const rowActions = useRef(new Map<TLookRow, TLookRowActions>());

  const groupProps = (groupRows: readonly TLookRow[]): TLookRowsGroup => ({
    openValues: openRows.filter((row) => groupRows.includes(row)),
    onOpenValuesChange: (next) =>
      setOpenRows((prev) => nextOpenRows(prev, groupRows, next)),
    actionsRef: (actions: TMaybeNull<TLookRowActions>) => {
      for (const row of groupRows) {
        if (actions) {
          rowActions.current.set(row, actions);
        } else {
          rowActions.current.delete(row);
        }
      }
    },
  });

  const revealRow = (row: TLookRow) =>
    setOpenRows((prev) => revealOpenRow(prev, row));

  const revealCard = (row: TLookRow) =>
    rowActions.current.get(row)?.openRow(row, { focus: true });

  return { groupProps, revealRow, revealCard };
};
