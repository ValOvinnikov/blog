import {
  type IWithClassName,
  type IWithDataTestId,
  TEXT_ROLE,
} from '@shinefold/config';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import type { ReactNode } from 'react';

export type TPricingCardNameProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** Names a `PricingCard`'s tier. */
export const PricingCardName = ({
  className,
  dataTestId,
  children,
}: TPricingCardNameProps) => (
  <Heading
    level={3}
    visual={TEXT_ROLE.CARD_TITLE}
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </Heading>
);
