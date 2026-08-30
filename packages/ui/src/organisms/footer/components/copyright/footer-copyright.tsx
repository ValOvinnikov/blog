import type { IWithClassName, IWithDataTestId } from '@blog/config';

import { footerCopyrightVariants } from './footer-copyright-variants';

export type TFooterCopyrightProps = IWithClassName &
  IWithDataTestId & {
    title: string;
    /** The year shown in "© {year} {title}", computed by the caller. */
    year: number;
  };

/**
 * FooterCopyright — the copyright line in the site `Footer`, rendering
 * "© {year} {title}".
 */
export const FooterCopyright = ({
  title,
  year,
  className,
  dataTestId,
}: TFooterCopyrightProps) => (
  <span
    className={footerCopyrightVariants({ class: className })}
    data-testid={dataTestId}
  >
    &copy; {year} {title}
  </span>
);
