import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes } from 'react';

import {
  statusBadgeVariants,
  type TStatusBadgeVariants,
} from './status-badge-variants';

export type TStatusBadgeProps = HTMLAttributes<HTMLSpanElement> &
  IWithDataTestId & {
    tone: NonNullable<TStatusBadgeVariants['tone']>;
  };

/**
 * StatusBadge — a small inline pill signalling a state such as "subscribed",
 * "pending confirmation", or "not linked". Colour is never the only signal —
 * pair it with adjacent text carrying the same meaning.
 */
export const StatusBadge = ({
  tone,
  className,
  dataTestId,
  ...rest
}: TStatusBadgeProps) => {
  return (
    <span
      {...rest}
      data-testid={dataTestId}
      className={statusBadgeVariants({ tone, class: className })}
    />
  );
};
