import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { timelineBodyVariants } from './timeline-body-variants';

export type TTimelineBodyProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** Slot for a `Timeline.Item`'s supporting copy, filled by the caller with rendered Portable Text. */
export const TimelineBody = ({
  className,
  dataTestId,
  children,
}: TTimelineBodyProps) => (
  <div
    className={timelineBodyVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
