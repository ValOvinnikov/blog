import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  statusBadgeVariants,
  type TStatusBadgeVariants,
} from './status-badge-variants';

export type TStatusBadgeProps = IWithClassName &
  IWithDataTestId & {
    tone: NonNullable<TStatusBadgeVariants['tone']>;
    children?: ReactNode;
  };

/** A small inline pill signalling a state such as "subscribed", "pending confirmation", or "not linked". */
export const StatusBadge = ({
  tone,
  className,
  dataTestId,
  children,
}: TStatusBadgeProps) => {
  return (
    <span
      data-testid={dataTestId}
      className={statusBadgeVariants({ tone, class: className })}
    >
      {children}
    </span>
  );
};
