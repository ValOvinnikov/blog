import type { ReactNode } from 'react';

import { bandCellVariants } from './band-cell-variants';

export type TBandCellProps = {
  label: string;
  children: ReactNode;
  isFullRow?: boolean;
  isMono?: boolean;
};

export const BandCell = ({
  label,
  children,
  isFullRow = false,
  isMono = false,
}: TBandCellProps) => {
  const { root, term, value } = bandCellVariants({ isFullRow, isMono });

  return (
    <div className={root()}>
      <dt className={term()}>{label}</dt>
      <dd className={value()}>{children}</dd>
    </div>
  );
};
