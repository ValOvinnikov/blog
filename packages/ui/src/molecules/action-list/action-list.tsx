import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes } from 'react';

import { actionListVariants } from './action-list-variants';

export interface IActionListProps
  extends HTMLAttributes<HTMLDivElement>, IWithDataTestId {}

/**
 * ActionList — flex wrapper for hero CTA buttons.
 * Children (buttons, links) are passed from outside.
 */
export const ActionList = ({
  className,
  dataTestId,
  children,
  ...rest
}: IActionListProps) => (
  <div
    className={actionListVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  >
    {children}
  </div>
);
