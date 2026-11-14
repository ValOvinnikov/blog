import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import {
  SHINEFOLD_LOGO,
  SHINEFOLD_LOGO_NAME,
  SHINEFOLD_LOGO_VARIANT,
} from '@blog/utils/shinefold-logo';

import { footerPoweredByVariants } from './footer-powered-by-variants';

export type TFooterPoweredByProps = IWithClassName &
  IWithDataTestId & {
    label: string;
    href: string;
    linkAs?: TAnchorElementType;
  };

const { viewBox, shapes } = SHINEFOLD_LOGO[SHINEFOLD_LOGO_VARIANT.MONO];

/** The platform's attribution link, always the last item of the footer's bottom row and outside the site's own legal links. */
export const FooterPoweredBy = ({
  label,
  href,
  linkAs,
  className,
  dataTestId,
}: TFooterPoweredByProps) => {
  const { root, label: labelClass, logo } = footerPoweredByVariants();

  return (
    <TextLink
      appearance="nav"
      href={href}
      as={linkAs}
      className={root({ class: className })}
      dataTestId={dataTestId}
    >
      <span>
        <span className={labelClass()}>{label}</span>{' '}
        <svg
          viewBox={viewBox}
          role="img"
          aria-label={SHINEFOLD_LOGO_NAME}
          className={logo()}
        >
          {shapes.map(({ d, fill, fillRule }) => (
            <path key={d} d={d} fill={fill} fillRule={fillRule} />
          ))}
        </svg>
      </span>
    </TextLink>
  );
};
