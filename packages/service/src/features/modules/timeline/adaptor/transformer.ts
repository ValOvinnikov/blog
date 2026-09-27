import { TIMELINE_MARKER_STYLE, type TTimelineMarkerStyle } from '@blog/config';
import { toCtaButtons } from '@blog/service/shared/transformers/cta/to-cta-buttons';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import { toPortableText } from '@blog/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { InferResultType } from 'groqd';

import type { timelineModuleQuery } from './query';
import type { TTimelineItem, TTimelineModule } from './types';

export type TRawTimelineModule = InferResultType<typeof timelineModuleQuery>;

type TRawTimelineItem = NonNullable<TRawTimelineModule['items']>[number];

function toTimelineItem(
  raw: TRawTimelineItem,
  markerStyle: TTimelineMarkerStyle,
): TTimelineItem {
  return {
    id: raw._key,
    marker:
      markerStyle === TIMELINE_MARKER_STYLE.NUMBERED
        ? undefined
        : (raw.marker ?? undefined),
    heading: raw.heading,
    body: raw.body?.map(toPortableText) ?? undefined,
  };
}

export function toTimelineModule(raw: TRawTimelineModule): TTimelineModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    markerStyle: raw.markerStyle,
    items: raw.items.map((item) => toTimelineItem(item, raw.markerStyle)),
    orientation: raw.orientation,
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentAlignment: raw.contentAlignment ?? undefined,
    itemAlignment: raw.itemAlignment,
    layout: toLayout(raw.layout),
  };
}
