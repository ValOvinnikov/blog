import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { Text } from '@blog/ui/components/atoms/text';
import type { ReactNode } from 'react';

export type TPricingCardDescriptionProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** The one- or two-line summary of a `PricingCard`'s tier. */
export const PricingCardDescription = ({
  className,
  dataTestId,
  children,
}: TPricingCardDescriptionProps) => (
  <Text variant="supporting" className={className} dataTestId={dataTestId}>
    {children}
  </Text>
);
