import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { TextLink } from '@blog/ui/components/atoms/text-link';

import { footerPoweredByVariants } from './footer-powered-by-variants';

export type TFooterPoweredByProps = IWithClassName &
  IWithDataTestId & {
    label: string;
    productName: string;
    href: string;
    linkAs?: TAnchorElementType;
  };

/** The platform's attribution link, always the last item of the footer's bottom row and outside the site's own legal links. */
export const FooterPoweredBy = ({
  label,
  productName,
  href,
  linkAs,
  className,
  dataTestId,
}: TFooterPoweredByProps) => {
  const { root, name } = footerPoweredByVariants();

  return (
    <TextLink
      appearance="nav"
      href={href}
      as={linkAs}
      className={root({ class: className })}
      dataTestId={dataTestId}
    >
      <span>
        {label} <span className={name()}>{productName}</span>
      </span>
    </TextLink>
  );
};
