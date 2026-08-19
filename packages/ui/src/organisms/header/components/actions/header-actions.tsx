import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { headerActionsVariants } from './header-actions-variants';

export type THeaderActionsProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * HeaderActions — the trailing actions cluster in the site `Header` (e.g. theme
 * toggle, auth controls); a styled `<div>` wrapper.
 */
export const HeaderActions = ({
  className,
  dataTestId,
  children,
}: THeaderActionsProps) => (
  <div
    className={headerActionsVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
