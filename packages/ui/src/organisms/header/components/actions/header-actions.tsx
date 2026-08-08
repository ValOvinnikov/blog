import type { ComponentPropsWithoutRef } from 'react';

import { headerActionsVariants } from './header-actions-variants';

/**
 * HeaderActions — the trailing actions cluster in the site `Header` (e.g. theme
 * toggle, auth controls); a styled `<div>` wrapper.
 */
export const HeaderActions = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <div className={headerActionsVariants({ class: className })} {...rest} />
);
