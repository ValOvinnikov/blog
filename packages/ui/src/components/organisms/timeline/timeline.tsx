import type {
  IWithClassName,
  IWithDataTestId,
  TContentAlignment,
  TTimelineMarkerStyle,
  TTimelineOrientation,
} from '@blog/config';
import type { TCompoundChildren, TCompoundComponent } from '@blog/ui/lib/react';
import { Children, type CSSProperties, type ElementType } from 'react';

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

/** A sequence of steps or milestones that reads as one connected line. */
const TimelineRoot = ({
  orientation,
  itemAlignment,
  markerStyle,
  children,
  className,
  dataTestId,
}: TTimelineProps) => {
  const { root, itemShare, list } = timelineVariants({
    orientation,
    itemAlignment,
    markerStyle,
  });

  return (
    <div
      className={root({ class: className })}
      style={
        {
          '--timeline-items': Children.toArray(children).length,
        } as CSSProperties
      }
      data-testid={dataTestId}
    >
      <div className={itemShare()}>
        <ol role="list" className={list()}>
          {children}
        </ol>
      </div>
    </div>
  );
};

export const Timeline: TCompoundComponent<
  typeof TimelineRoot,
  typeof TimelineParts
> = Object.assign(TimelineRoot, TimelineParts);
