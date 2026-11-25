import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { ReactNode } from 'react';

import { headerActionsVariants } from './header-actions-variants';

export type THeaderActionsProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** Groups the controls at the trailing end of the header, such as the theme toggle and sign-in. */
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
