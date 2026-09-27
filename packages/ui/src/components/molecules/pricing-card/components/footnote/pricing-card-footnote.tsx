import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { pricingCardFootnoteVariants } from './pricing-card-footnote-variants';

export type TPricingCardFootnoteProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** The small print at the foot of a `PricingCard` (e.g. tax or billing-cycle caveats). */
export const PricingCardFootnote = ({
  className,
  dataTestId,
  children,
}: TPricingCardFootnoteProps) => (
  <p
    className={pricingCardFootnoteVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </p>
);
