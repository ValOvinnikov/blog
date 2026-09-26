import type {
  IWithClassName,
  IWithDataTestId,
  TContentAlignment,
  TTimelineMarkerStyle,
  TTimelineOrientation,
} from '@blog/config';
import type { TCompoundChildren, TCompoundComponent } from '@blog/ui/lib/react';
import type { ElementType } from 'react';

import { TimelineBody } from './components/body/timeline-body';
import { TimelineHeading } from './components/heading/timeline-heading';
import { TimelineItem } from './components/item/timeline-item';
import { TimelineMarker } from './components/marker/timeline-marker';
import { timelineVariants } from './timeline-variants';

const TimelineParts = {
  Item: TimelineItem,
  Marker: TimelineMarker,
  Heading: TimelineHeading,
  Body: TimelineBody,
} satisfies Record<string, ElementType>;

export type TTimelineProps = IWithClassName &
  IWithDataTestId & {
    orientation: TTimelineOrientation;
    itemAlignment: Extract<TContentAlignment, 'LEFT' | 'CENTER'>;
    markerStyle: TTimelineMarkerStyle;
    children?: TCompoundChildren<Pick<typeof TimelineParts, 'Item'>>;
  };

/** An ordered sequence of steps or milestones, joined by one connecting line, rendered as an `<ol>` of `Timeline.Item`s. */
const TimelineRoot = ({
  orientation,
  itemAlignment,
  markerStyle,
  children,
  className,
  dataTestId,
}: TTimelineProps) => {
  const { root } = timelineVariants({
    orientation,
    itemAlignment,
    markerStyle,
  });

  return (
    <ol
      role="list"
      className={root({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </ol>
  );
};

export const Timeline: TCompoundComponent<
  typeof TimelineRoot,
  typeof TimelineParts
> = Object.assign(TimelineRoot, TimelineParts);
