import {
  TIMELINE_MARKER_STYLE,
  type IWithClassName,
  type IWithDataTestId,
  type TTimelineMarkerStyle,
} from '@blog/config';
import type { ReactNode } from 'react';

import { timelineMarkerVariants } from './timeline-marker-variants';

export type TTimelineMarkerProps = IWithClassName &
  IWithDataTestId & {
    markerStyle: TTimelineMarkerStyle;
    children: ReactNode;
  };

/** The point on a `Timeline.Item`'s line — a generated number, hidden from assistive tech since the `<ol>` already conveys the count, or a caller-supplied label, which is real content and stays announced. */
export const TimelineMarker = ({
  markerStyle,
  className,
  dataTestId,
  children,
}: TTimelineMarkerProps) => (
  <span
    aria-hidden={markerStyle === TIMELINE_MARKER_STYLE.NUMBERED || undefined}
    className={timelineMarkerVariants({ markerStyle, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </span>
);
