import { TIMELINE_MARKER_STYLE, TIMELINE_ORIENTATION } from '@blog/config';
import {
  makeRawTimelineItem,
  makeRawTimelineModule,
} from '@blog/service/testing/modules/fixtures';

import { toTimelineModule } from './transformer';

describe(toTimelineModule, () => {
  it('maps a Labelled module in authored order, with each item marker, heading and body', () => {
    const raw = makeRawTimelineModule({
      markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      items: [
        makeRawTimelineItem({
          _key: 'block-timeline-a',
          marker: '2019',
          heading: 'Founded',
        }),
        makeRawTimelineItem({
          _key: 'block-timeline-b',
          marker: '2023',
          heading: 'Series A',
        }),
      ],
    });

    const module = toTimelineModule(raw);

    expect(module.markerStyle).toBe(TIMELINE_MARKER_STYLE.LABELLED);
    expect(module.orientation).toBe(TIMELINE_ORIENTATION.HORIZONTAL);
    expect(module.items).toEqual([
      expect.objectContaining({
        id: 'block-timeline-a',
        marker: '2019',
        heading: 'Founded',
      }),
      expect.objectContaining({
        id: 'block-timeline-b',
        marker: '2023',
        heading: 'Series A',
      }),
    ]);
    expect(module.items[0]?.body?.[0]?.children?.[0]?.text).toBe(
      'The project begins.',
    );
  });

  it('drops every item marker on a Numbered module, even one left over from Labelled', () => {
    const raw = makeRawTimelineModule({
      markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
      items: [
        makeRawTimelineItem({ _key: 'block-timeline-a', marker: '2019' }),
        makeRawTimelineItem({ _key: 'block-timeline-b', marker: null }),
      ],
    });

    const module = toTimelineModule(raw);

    expect(module.items.map((item) => item.marker)).toEqual([
      undefined,
      undefined,
    ]);
    expect(module.items.map((item) => item.id)).toEqual([
      'block-timeline-a',
      'block-timeline-b',
    ]);
  });
});
