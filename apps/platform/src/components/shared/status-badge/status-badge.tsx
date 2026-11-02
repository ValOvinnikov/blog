import type { IWithClassName } from '@blog/config/types';

import {
  statusBadgeVariants,
  type TStatusBadgeVariants,
} from './status-badge-variants';

export type TStatusBadgeProps = IWithClassName & {
  id?: string;
  tone?: TStatusBadgeVariants['tone'];
  hasDot?: boolean;
  children: React.ReactNode;
};

export const StatusBadge = ({
  id,
  tone,
  hasDot = true,
  children,
  className,
}: TStatusBadgeProps) => {
  const { root, dot } = statusBadgeVariants({ tone });

  return (
    <span id={id} className={root({ class: className })}>
      {hasDot && (
        <span
          className={dot()}
          aria-hidden="true"
          data-testid="status-badge-dot"
        />
      )}
      {children}
    </span>
  );
};
