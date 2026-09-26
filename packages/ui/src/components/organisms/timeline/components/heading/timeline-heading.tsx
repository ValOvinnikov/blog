import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { Heading } from '@blog/ui/components/atoms/heading';
import type { ReactNode } from 'react';

export type TTimelineHeadingProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** The `<h3>` naming a `Timeline.Item`. */
export const TimelineHeading = ({
  className,
  dataTestId,
  children,
}: TTimelineHeadingProps) => (
  <Heading
    level={3}
    visual="card"
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </Heading>
);
