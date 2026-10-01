import {
  TIMELINE_HORIZONTAL_ITEM_CAP,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import type { TTimelineModule } from '@blog/service';
import { Timeline } from '@blog/ui/components/organisms/timeline';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { PortableText } from '@web/components/shared/portable-text';
import { Section } from '@web/components/shared/section';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';

import { timelineModuleViewVariants } from './timeline-module-view-variants';

export interface ITimelineModuleViewProps extends TTimelineModule {
  titleId: string;
  dataTestId: string;
}

export const TimelineModuleView = ({
  brandVariant,
  headingBlock,
  markerStyle,
  items,
  orientation: requestedOrientation,
  ctaButtons,
  contentAlignment,
  itemAlignment,
  layout,
  titleId,
  dataTestId,
}: ITimelineModuleViewProps) => {
  const actions = moduleGridActionsVariants({ align: contentAlignment });
  const orientation =
    items.length > TIMELINE_HORIZONTAL_ITEM_CAP
      ? TIMELINE_ORIENTATION.VERTICAL
      : requestedOrientation;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <div className={timelineModuleViewVariants()}>
        <ModuleHeading
          headingBlock={headingBlock}
          id={titleId}
          level={2}
          align={contentAlignment}
          variant="section"
        />
        <Timeline
          orientation={orientation}
          itemAlignment={itemAlignment}
          markerStyle={markerStyle}
          dataTestId={`${dataTestId}-timeline-${orientation.toLowerCase()}`}
        >
          {items.map(({ id, marker, heading, body }, index) => {
            const markerContent =
              markerStyle === TIMELINE_MARKER_STYLE.NUMBERED
                ? index + 1
                : marker;

            return (
              <Timeline.Item
                key={id}
                orientation={orientation}
                itemAlignment={itemAlignment}
              >
                {!!markerContent && (
                  <Timeline.Marker markerStyle={markerStyle}>
                    {markerContent}
                  </Timeline.Marker>
                )}
                <Timeline.Heading>{heading}</Timeline.Heading>
                {!!body?.length && (
                  <Timeline.Body>
                    <PortableText value={body} />
                  </Timeline.Body>
                )}
              </Timeline.Item>
            );
          })}
        </Timeline>
        {ctaButtons.length > 0 && (
          <div className={actions.actions()}>
            <ActionGroup actions={ctaButtons} />
          </div>
        )}
      </div>
    </Section>
  );
};
