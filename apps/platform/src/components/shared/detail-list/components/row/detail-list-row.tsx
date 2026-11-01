import {
  detailListVariants,
  type TDetailListVariants,
} from '@platform/components/shared/detail-list/detail-list-variants';
import type { ReactNode } from 'react';

export type TDetailListRowProps = {
  label: string;
  isMono?: TDetailListVariants['isMono'];
  isBordered?: TDetailListVariants['isBordered'];
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export const DetailListRow = ({
  label,
  isMono,
  isBordered = false,
  children,
  action,
  className,
}: TDetailListRowProps) => {
  const { row, term, description, value } = detailListVariants({
    isMono,
    isBordered,
  });

  const pair = (
    <>
      <dt className={term()}>{label}</dt>
      <dd className={description({ class: className })}>
        <span className={value()}>{children}</span>
        {action}
      </dd>
    </>
  );

  return isBordered ? <div className={row()}>{pair}</div> : pair;
};
