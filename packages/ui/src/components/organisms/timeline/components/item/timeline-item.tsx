import {
  CONTENT_ALIGNMENT,
  TIMELINE_ORIENTATION,
  type IWithClassName,
  type IWithDataTestId,
  type TContentAlignment,
  type TTimelineOrientation,
} from '@blog/config';
import type { TCompoundChildren } from '@blog/ui/lib/react';

import type { TimelineBody } from '../body/timeline-body';
import type { TimelineHeading } from '../heading/timeline-heading';
import type { TimelineMarker } from '../marker/timeline-marker';

import { timelineItemVariants } from './timeline-item-variants';

type TTimelineItemParts = {
  Marker: typeof TimelineMarker;
  Heading: typeof TimelineHeading;
  Body: typeof TimelineBody;
};

export type TTimelineItemProps = IWithClassName &
  IWithDataTestId & {
    orientation?: TTimelineOrientation;
    itemAlignment?: Extract<TContentAlignment, 'LEFT' | 'CENTER'>;
    children?: TCompoundChildren<TTimelineItemParts>;
  };

/** One step on a `Timeline`. Expects `Timeline.Marker` first, then `Timeline.Heading` and an optional `Timeline.Body`, in that order — the layout follows DOM position rather than slot detection. */
export const TimelineItem = ({
  orientation = TIMELINE_ORIENTATION.VERTICAL,
  itemAlignment = CONTENT_ALIGNMENT.LEFT,
  children,
  className,
  dataTestId,
}: TTimelineItemProps) => (
  <li
    className={timelineItemVariants({
      orientation,
      itemAlignment,
      class: className,
    })}
    data-testid={dataTestId}
  >
    {children}
  </li>
);
