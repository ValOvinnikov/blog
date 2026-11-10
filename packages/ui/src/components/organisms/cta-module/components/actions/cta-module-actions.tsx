import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

export type TCtaModuleActionsProps = IWithClassName &
  IWithDataTestId & { children?: ReactNode };

/** The row a `CtaModule` lays its buttons and links out in. */
export const CtaModuleActions = ({
  className,
  dataTestId,
  children,
}: TCtaModuleActionsProps) => (
  <div className={className} data-testid={dataTestId}>
    {children}
  </div>
);
