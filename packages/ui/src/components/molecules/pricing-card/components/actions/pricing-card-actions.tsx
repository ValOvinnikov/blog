import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { pricingCardActionsVariants } from './pricing-card-actions-variants';

export type TPricingCardActionsProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** The stacked, full-width call-to-action slot of a `PricingCard`; the caller fills it with its own action buttons. */
export const PricingCardActions = ({
  className,
  dataTestId,
  children,
}: TPricingCardActionsProps) => (
  <div
    className={pricingCardActionsVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
