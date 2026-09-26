import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { Heading } from '@blog/ui/components/atoms/heading';
import type { ReactNode } from 'react';

export type TPricingCardNameProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** The `<h3>` naming a `PricingCard`'s tier. */
export const PricingCardName = ({
  className,
  dataTestId,
  children,
}: TPricingCardNameProps) => (
  <Heading
    level={3}
    visual="card"
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </Heading>
);
