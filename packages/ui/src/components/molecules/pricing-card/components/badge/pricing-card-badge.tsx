import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { pricingCardBadgeVariants } from './pricing-card-badge-variants';

export type TPricingCardBadgeProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** The raised-tier callout pinned to the top edge of a highlighted `PricingCard`. */
export const PricingCardBadge = ({
  className,
  dataTestId,
  children,
}: TPricingCardBadgeProps) => (
  <span
    className={pricingCardBadgeVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </span>
);
