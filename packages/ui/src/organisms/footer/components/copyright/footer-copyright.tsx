import type { IWithClassName, IWithDataTestId } from '@blog/config';

import { footerCopyrightVariants } from './footer-copyright-variants';

export type TFooterCopyrightProps = IWithClassName &
  IWithDataTestId & {
    title: string;
  };

/**
 * FooterCopyright — the copyright line in the site `Footer`; renders
 * "© {year} {title}" with the current year filled in automatically.
 */
export const FooterCopyright = ({
  title,
  className,
  dataTestId,
}: TFooterCopyrightProps) => (
  <span
    className={footerCopyrightVariants({ class: className })}
    data-testid={dataTestId}
  >
    &copy; {new Date().getFullYear()} {title}
  </span>
);
