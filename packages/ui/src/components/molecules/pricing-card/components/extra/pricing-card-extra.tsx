import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { pricingCardExtraVariants } from './pricing-card-extra-variants';

export type TPricingCardExtraProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** One smaller price line below a `PricingCard`'s headline `Price` (e.g. a one-time setup fee). */
export const PricingCardExtra = ({
  className,
  dataTestId,
  children,
}: TPricingCardExtraProps) => (
  <p
    className={pricingCardExtraVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </p>
);
