import type { TTimelineItem } from '@blog/service';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

export const mockTimelineItem = (
  overrides: Partial<TTimelineItem> = {},
): TTimelineItem => ({
  id: 'timeline-item-1',
  marker: undefined,
  heading: 'Discovery',
  body: [mockPortableTextBlock('We learn what you need.')],
  ...overrides,
});

export const MOCK_TIMELINE_HEADING = 'How we work';
