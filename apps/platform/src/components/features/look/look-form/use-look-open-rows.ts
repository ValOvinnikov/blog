import type { TLookRow } from '@platform/constants/look-row';
import {
  nextOpenRows,
  revealOpenRow,
} from '@platform/utils/look-open-rows/look-open-rows';
import { useState } from 'react';

export type TLookRowsGroup = {
  openValues: readonly TLookRow[];
  onOpenValuesChange: (values: TLookRow[]) => void;
};

export const useLookOpenRows = () => {
  const [openRows, setOpenRows] = useState<readonly TLookRow[]>([]);

  const groupProps = (groupRows: readonly TLookRow[]): TLookRowsGroup => ({
    openValues: openRows.filter((row) => groupRows.includes(row)),
    onOpenValuesChange: (next) =>
      setOpenRows((prev) => nextOpenRows(prev, groupRows, next)),
  });

  const revealRow = (row: TLookRow) =>
    setOpenRows((prev) => revealOpenRow(prev, row));

  return { groupProps, revealRow };
};
