import {
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config/constants';
import {
  mockRawTimelineItem,
  mockRawTimelineModule,
} from '@blog/service/testing/modules/fixtures';

import { toTimelineModule } from './transformer';

const FIRST_ID = 'block-timeline-a';
const SECOND_ID = 'block-timeline-b';
const FIRST_MARKER = '2019';

describe(toTimelineModule, () => {
  it('maps a Labelled module in authored order, with each item marker and heading', () => {
    const raw = mockRawTimelineModule({
      markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      items: [
        mockRawTimelineItem({
          _key: FIRST_ID,
          marker: FIRST_MARKER,
          heading: 'Founded',
        }),
        mockRawTimelineItem({
          _key: SECOND_ID,
          marker: '2023',
          heading: 'Series A',
        }),
      ],
    });

    const module = toTimelineModule(raw);

    expect(module.markerStyle).toBe(TIMELINE_MARKER_STYLE.LABELLED);
    expect(module.orientation).toBe(TIMELINE_ORIENTATION.HORIZONTAL);
    expect(
      module.items.map(({ id, marker, heading }) => ({ id, marker, heading })),
    ).toEqual([
      { id: FIRST_ID, marker: FIRST_MARKER, heading: 'Founded' },
      { id: SECOND_ID, marker: '2023', heading: 'Series A' },
    ]);
    expect(module.items[0]?.body?.[0]?.children?.[0]?.text).toBe(
      'The project begins.',
    );
  });

  it('drops every item marker on a Numbered module, even a leftover one', () => {
    const raw = mockRawTimelineModule({
      markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
      items: [
        mockRawTimelineItem({ _key: FIRST_ID, marker: FIRST_MARKER }),
        mockRawTimelineItem({ _key: SECOND_ID, marker: null }),
      ],
    });

    const module = toTimelineModule(raw);

    expect(module.items.map(({ id, marker }) => ({ id, marker }))).toEqual([
      { id: FIRST_ID, marker: undefined },
      { id: SECOND_ID, marker: undefined },
    ]);
  });
});
