import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { actionListVariants } from './action-list-variants';

export type TActionListProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * ActionList — flex wrapper for hero CTA buttons.
 * Children (buttons, links) are passed from outside.
 */
export const ActionList = ({
  className,
  dataTestId,
  children,
}: TActionListProps) => (
  <div
    className={actionListVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
