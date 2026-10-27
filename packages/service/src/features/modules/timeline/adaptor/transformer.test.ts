import {
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config/constants';
import {
  mockRawTimelineItem,
  mockRawTimelineModule,
} from '@blog/service/testing/modules/fixtures';
import { mockRawParagraphTextBlock } from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toTimelineModule, type TRawTimelineModule } from './transformer';

type TRawTimelineItemBody = NonNullable<
  NonNullable<TRawTimelineModule['items']>[number]['body']
>[number];

faker.seed(5);

const MOCK_FIRST_ID = faker.string.uuid();
const MOCK_SECOND_ID = faker.string.uuid();
const MOCK_FIRST_MARKER = faker.lorem.word();
const MOCK_SECOND_MARKER = faker.lorem.word();
const MOCK_FIRST_HEADING = faker.lorem.words(2);
const MOCK_SECOND_HEADING = faker.lorem.words(2);
const MOCK_BODY_TEXT = faker.lorem.sentence();

describe(toTimelineModule, () => {
  it('maps a Labelled module in authored order, with each item marker and heading', () => {
    const raw = mockRawTimelineModule({
      markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      items: [
        mockRawTimelineItem({
          _key: MOCK_FIRST_ID,
          marker: MOCK_FIRST_MARKER,
          heading: MOCK_FIRST_HEADING,
        }),
        mockRawTimelineItem({
          _key: MOCK_SECOND_ID,
          marker: MOCK_SECOND_MARKER,
          heading: MOCK_SECOND_HEADING,
        }),
      ],
    });

    const module = toTimelineModule(raw);

    expect(module.markerStyle).toBe(TIMELINE_MARKER_STYLE.LABELLED);
    expect(module.orientation).toBe(TIMELINE_ORIENTATION.HORIZONTAL);
    expect(
      module.items.map(({ id, marker, heading }) => ({ id, marker, heading })),
    ).toEqual([
      {
        id: MOCK_FIRST_ID,
        marker: MOCK_FIRST_MARKER,
        heading: MOCK_FIRST_HEADING,
      },
      {
        id: MOCK_SECOND_ID,
        marker: MOCK_SECOND_MARKER,
        heading: MOCK_SECOND_HEADING,
      },
    ]);
  });

  it('maps an item body into portable text', () => {
    const raw = mockRawTimelineModule({
      items: [
        mockRawTimelineItem({
          body: [
            mockRawParagraphTextBlock<TRawTimelineItemBody>({
              text: MOCK_BODY_TEXT,
            }),
          ],
        }),
      ],
    });

    const module = toTimelineModule(raw);

    expect(module.items[0]?.body?.[0]?.children?.[0]?.text).toBe(
      MOCK_BODY_TEXT,
    );
  });

  it('drops every item marker on a Numbered module, even a leftover one', () => {
    const raw = mockRawTimelineModule({
      markerStyle: TIMELINE_MARKER_STYLE.NUMBERED,
      items: [
        mockRawTimelineItem({ _key: MOCK_FIRST_ID, marker: MOCK_FIRST_MARKER }),
        mockRawTimelineItem({ _key: MOCK_SECOND_ID, marker: null }),
      ],
    });

    const module = toTimelineModule(raw);

    expect(module.items.map(({ id, marker }) => ({ id, marker }))).toEqual([
      { id: MOCK_FIRST_ID, marker: undefined },
      { id: MOCK_SECOND_ID, marker: undefined },
    ]);
  });
});
