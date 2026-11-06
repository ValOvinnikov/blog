import type { IWithClassName, IWithDataTestId } from '@blog/config';

import { footerPoweredByVariants } from './footer-powered-by-variants';

export type TFooterPoweredByProps = IWithClassName &
  IWithDataTestId & {
    label: string;
    productName: string;
    href: string;
  };

/** The platform's attribution link, always the last item of the footer's bottom row and outside the site's own legal links. */
export const FooterPoweredBy = ({
  label,
  productName,
  href,
  className,
  dataTestId,
}: TFooterPoweredByProps) => {
  const { root, name } = footerPoweredByVariants();

  return (
    <a
      href={href}
      className={root({ class: className })}
      data-testid={dataTestId}
    >
      {label} <span className={name()}>{productName}</span>
    </a>
  );
};
