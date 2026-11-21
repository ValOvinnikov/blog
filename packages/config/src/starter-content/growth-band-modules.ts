import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@shinefold/config/constants';
import type {
  Module_stats,
  Module_timeline,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterModule } from './starter-document';
import {
  localizedParagraphText,
  localizedString,
  moduleHeadingBlock,
} from './starter-fields';
import type { TModuleInput } from './starter-modules';

type TTimelineCopy = {
  heading: string;
  items: readonly { marker: string; heading: string; body: string }[];
};

type TStatsCopy = {
  heading: string;
  footnote: string;
  stats: readonly { value: string; label: string }[];
};

export function buildTimelineModule({
  id,
  title,
  locale,
  timeline: { heading, items },
}: TModuleInput & {
  timeline: TTimelineCopy;
}): TStarterModule<Module_timeline> {
  return {
    _id: id,
    _type: 'module_timeline',
    title,
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: moduleHeadingBlock(locale, heading),
    markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
    orientation: TIMELINE_ORIENTATION.VERTICAL,
    itemAlignment: CONTENT_ALIGNMENT.LEFT,
    items: items.map((item, index) => ({
      _key: `item${index}`,
      _type: 'timelineItem',
      marker: localizedString(locale, item.marker),
      heading: localizedString(locale, item.heading),
      body: localizedParagraphText(locale, item.body),
    })),
  };
}

export function buildStatsModule({
  id,
  title,
  locale,
  stats: { heading, footnote, stats },
}: TModuleInput & { stats: TStatsCopy }): TStarterModule<Module_stats> {
  return {
    _id: id,
    _type: 'module_stats',
    title,
    brandVariant: BRAND_VARIANT.SECONDARY,
    headingBlock: moduleHeadingBlock(locale, heading),
    footnote: localizedString(locale, footnote),
    stats: stats.map((stat, index) => ({
      _key: `stat${index}`,
      _type: 'stat',
      value: localizedString(locale, stat.value),
      label: localizedString(locale, stat.label),
    })),
  };
}
