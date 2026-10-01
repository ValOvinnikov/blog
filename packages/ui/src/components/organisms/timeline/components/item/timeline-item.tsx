import {
  CONTENT_ALIGNMENT,
  TIMELINE_ORIENTATION,
  type IWithClassName,
  type IWithDataTestId,
  type TContentAlignment,
  type TTimelineOrientation,
} from '@blog/config';
import { mapCompoundSlots, type TCompoundChildren } from '@blog/ui/lib/react';
import { Fragment } from 'react';

import { TimelineBody } from '../body/timeline-body';
import { TimelineHeading } from '../heading/timeline-heading';
import { TimelineMarker } from '../marker/timeline-marker';

import { timelineItemVariants } from './timeline-item-variants';

const TimelineItemParts = {
  Marker: TimelineMarker,
  Heading: TimelineHeading,
  Body: TimelineBody,
};

export type TTimelineItemProps = IWithClassName &
  IWithDataTestId & {
    orientation?: TTimelineOrientation;
    itemAlignment?: Extract<TContentAlignment, 'LEFT' | 'CENTER'>;
    children?: TCompoundChildren<typeof TimelineItemParts>;
  };

/** One step on the timeline: a marker, a heading and optional supporting copy. */
export const TimelineItem = ({
  orientation = TIMELINE_ORIENTATION.VERTICAL,
  itemAlignment = CONTENT_ALIGNMENT.LEFT,
  children,
  className,
  dataTestId,
}: TTimelineItemProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, TimelineItemParts);
  const { root, marker, content } = timelineItemVariants({
    orientation,
    itemAlignment,
  });

  return (
    <li className={root({ class: className })} data-testid={dataTestId}>
      <div className={marker()}>{slots.Marker}</div>
      <div className={content()}>
        {slots.Heading}
        {slots.Body}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </div>
    </li>
  );
};
