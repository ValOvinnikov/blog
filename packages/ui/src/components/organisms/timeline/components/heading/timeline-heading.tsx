import {
  type IWithClassName,
  type IWithDataTestId,
  TEXT_ROLE,
} from '@shinefold/config';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import type { ReactNode } from 'react';

export type TTimelineHeadingProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** The title of a single step. */
export const TimelineHeading = ({
  className,
  dataTestId,
  children,
}: TTimelineHeadingProps) => (
  <Heading
    level={3}
    visual={TEXT_ROLE.ITEM_TITLE}
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </Heading>
);
