import {
  detailListVariants,
  type TDetailListVariants,
} from '@platform/components/shared/detail-list/detail-list-variants';
import type { ReactNode } from 'react';

export type TDetailListRowProps = {
  label: string;
  isMono?: TDetailListVariants['isMono'];
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export const DetailListRow = ({
  label,
  isMono,
  children,
  action,
  className,
}: TDetailListRowProps) => {
  const { term, description, value } = detailListVariants({ isMono });

  return (
    <>
      <dt className={term()}>{label}</dt>
      <dd className={description({ class: className })}>
        <span className={value()}>{children}</span>
        {action}
      </dd>
    </>
  );
};
