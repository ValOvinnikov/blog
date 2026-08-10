import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { headerActionsVariants } from './header-actions-variants';

interface IHeaderActionsProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {}

/**
 * HeaderActions — the trailing actions cluster in the site `Header` (e.g. theme
 * toggle, auth controls); a styled `<div>` wrapper.
 */
export const HeaderActions = ({
  className,
  dataTestId,
  ...rest
}: IHeaderActionsProps) => (
  <div
    className={headerActionsVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
