import type { TCompoundComponent } from '@platform/lib/react';
import type { ElementType, ReactNode } from 'react';

import { DetailListRow } from './components/row/detail-list-row';
import { detailListVariants } from './detail-list-variants';

type TDetailListProps = {
  children: ReactNode;
  className?: string;
};

const DetailListRoot = ({ children, className }: TDetailListProps) => {
  const { root } = detailListVariants();

  return <dl className={root({ class: className })}>{children}</dl>;
};

const DetailListParts = {
  Row: DetailListRow,
} satisfies Record<string, ElementType>;

export const DetailList: TCompoundComponent<
  typeof DetailListRoot,
  typeof DetailListParts
> = Object.assign(DetailListRoot, DetailListParts);
