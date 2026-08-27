import type { ReactNode } from 'react';

import { DetailListRow } from './components/row/detail-list-row';
import { detailListVariants } from './detail-list-variants';

export type TDetailListProps = {
  children: ReactNode;
  className?: string;
};

const DetailListRoot = ({ children, className }: TDetailListProps) => {
  const { root } = detailListVariants();

  return <dl className={root({ class: className })}>{children}</dl>;
};

/**
 * The read-only definition-row pattern (`dt`/`dd` pairs laid out as a
 * two-column grid) used across the tenant overview's fact cards — a plain
 * value, a `StatusBadge`, or a value plus a trailing action link.
 */
export const DetailList = Object.assign(DetailListRoot, {
  Row: DetailListRow,
});
