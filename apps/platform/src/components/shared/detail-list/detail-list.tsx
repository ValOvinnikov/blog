import type { TCompoundComponent } from '@platform/lib/react';
import type { ElementType, ReactNode } from 'react';

import { DetailListRow } from './components/row/detail-list-row';
import {
  detailListVariants,
  type TDetailListVariants,
} from './detail-list-variants';

type TDetailListProps = {
  isStackedToLg?: TDetailListVariants['isStackedToLg'];
  children: ReactNode;
  className?: string;
};

const DetailListRoot = ({
  isStackedToLg = false,
  children,
  className,
}: TDetailListProps) => {
  const { root } = detailListVariants({ isStackedToLg });

  return <dl className={root({ class: className })}>{children}</dl>;
};

const DetailListParts = {
  Row: DetailListRow,
} satisfies Record<string, ElementType>;

export const DetailList: TCompoundComponent<
  typeof DetailListRoot,
  typeof DetailListParts
> = Object.assign(DetailListRoot, DetailListParts);
