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

/** The badge on a timeline item showing its step number or label. */
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
