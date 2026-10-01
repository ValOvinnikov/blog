import type { TTimelineItem } from '@blog/service';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';

export const makeTimelineItem = (
  overrides: Partial<TTimelineItem> = {},
): TTimelineItem => ({
  id: 'timeline-item-1',
  marker: undefined,
  heading: 'Discovery',
  body: [portableTextBlock('We learn what you need.')],
  ...overrides,
});
