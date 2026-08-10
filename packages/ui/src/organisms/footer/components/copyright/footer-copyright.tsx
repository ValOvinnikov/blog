import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { footerCopyrightVariants } from './footer-copyright-variants';

interface IFooterCopyrightProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>, IWithDataTestId {
  title: string;
}

/**
 * FooterCopyright — the copyright line in the site `Footer`; renders
 * "© {year} {title}" with the current year filled in automatically.
 */
export const FooterCopyright = ({
  title,
  className,
  dataTestId,
  ...rest
}: IFooterCopyrightProps) => (
  <span
    className={footerCopyrightVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  >
    &copy; {new Date().getFullYear()} {title}
  </span>
);
