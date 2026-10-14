import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  pricingCardGridVariants,
  type TPricingCardGridVariants,
} from './pricing-card-grid-variants';

export type TPricingCardGridProps = IWithClassName &
  IWithDataTestId & {
    columns?: TPricingCardGridVariants['columns'];
    children: ReactNode;
  };

/** Lays out a set of `PricingCard` tiers so their prices, features and actions line up across the row. */
export const PricingCardGrid = ({
  columns,
  children,
  className,
  dataTestId,
}: TPricingCardGridProps) => {
  const s = pricingCardGridVariants({ columns });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <div className={s.grid()} data-pricing-card-grid={true}>
        {children}
      </div>
    </div>
  );
};
