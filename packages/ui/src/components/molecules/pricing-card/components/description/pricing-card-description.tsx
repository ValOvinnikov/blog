import {
  type IWithClassName,
  type IWithDataTestId,
  TEXT_ROLE,
} from '@shinefold/config';
import { Text } from '@shinefold/ui/components/atoms/text';
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
  <Text
    textRole={TEXT_ROLE.CARD_BODY}
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </Text>
);
