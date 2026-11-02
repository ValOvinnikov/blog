import {
  nextOpenRows,
  revealOpenRow,
  type TLookRowKey,
} from '@platform/utils/look-open-rows/look-open-rows';
import { useState } from 'react';

export type TLookRowsGroup = {
  openValues: readonly TLookRowKey[];
  onOpenValuesChange: (values: TLookRowKey[]) => void;
};

export const useLookOpenRows = () => {
  const [openRows, setOpenRows] = useState<readonly TLookRowKey[]>([]);

  const groupProps = (groupRows: readonly TLookRowKey[]): TLookRowsGroup => ({
    openValues: openRows.filter((row) => groupRows.includes(row)),
    onOpenValuesChange: (next) =>
      setOpenRows((prev) => nextOpenRows(prev, groupRows, next)),
  });

  const revealRow = (row: TLookRowKey) =>
    setOpenRows((prev) => revealOpenRow(prev, row));

  return { groupProps, revealRow };
};
