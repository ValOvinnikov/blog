import type { IWithClassName, IWithDataTestId } from '@shinefold/config';

import { footerCopyrightVariants } from './footer-copyright-variants';

export type TFooterCopyrightProps = IWithClassName &
  IWithDataTestId & {
    title: string;
    year: number;
  };

/** The copyright line in the site `Footer`, rendering "© {year} {title}". */
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
