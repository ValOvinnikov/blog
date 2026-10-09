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

export const DetailList = Object.assign(DetailListRoot, {
  Row: DetailListRow,
});
