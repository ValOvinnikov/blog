import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  LOCALE_ISO_CODES,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config/constants';
import {
  MOCK_TIMELINE_MODULE_ID,
  mockRawTimelineItem,
  mockRawTimelineModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  mockLocalizedHeadingBlock,
  mockLocalizedParagraphText,
  mockLocalizedStrings,
  mockParagraphBlocks,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { timelineModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

faker.seed(4);

const MOCK_FIRST_KEY = faker.string.uuid();
const MOCK_SECOND_KEY = faker.string.uuid();
const MOCK_HEADING = { [EN]: faker.lorem.words(3), [NL]: faker.lorem.words(3) };
const MOCK_FIRST_MARKER = faker.lorem.word();
const MOCK_FIRST_HEADING = {
  [EN]: faker.lorem.words(2),
  [NL]: faker.lorem.words(2),
};
const MOCK_FIRST_BODY = {
  [EN]: faker.lorem.sentence(),
  [NL]: faker.lorem.sentence(),
};
const MOCK_SECOND_MARKER = {
  [EN]: faker.lorem.word(),
  [FR]: faker.lorem.word(),
};
const MOCK_SECOND_HEADING = faker.lorem.words(2);
const MOCK_SECOND_BODY = faker.lorem.sentence();

const MOCK_TIMELINE_DOCUMENT = {
  _id: MOCK_TIMELINE_MODULE_ID,
  _type: 'module_timeline',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
  markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
  items: [
    {
      _key: MOCK_FIRST_KEY,
      _type: 'timelineItem',
      marker: mockLocalizedStrings({
        [EN]: MOCK_FIRST_MARKER,
        [NL]: MOCK_FIRST_MARKER,
      }),
      heading: mockLocalizedStrings(MOCK_FIRST_HEADING),
      body: mockLocalizedParagraphText(MOCK_FIRST_BODY),
    },
    {
      _key: MOCK_SECOND_KEY,
      _type: 'timelineItem',
      marker: mockLocalizedStrings(MOCK_SECOND_MARKER),
      heading: mockLocalizedStrings({ [EN]: MOCK_SECOND_HEADING }),
      body: mockLocalizedParagraphText({ [EN]: MOCK_SECOND_BODY }),
    },
  ],
  orientation: TIMELINE_ORIENTATION.VERTICAL,
  itemAlignment: CONTENT_ALIGNMENT.LEFT,
};

async function runTimeline(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    timelineModuleQuery.query,
    [document],
    undefined,
    { id: MOCK_TIMELINE_MODULE_ID, locale, defaultLocale: EN },
  );

  return timelineModuleQuery.parse(raw);
}

describe('timelineModuleQuery', () => {
  it.each([
    ['a module with no headingBlock', { headingBlock: null }],
    ['a module with no items', { items: null }],
    [
      'an item with no heading',
      { items: [{ ...mockRawTimelineItem(), heading: null }] },
    ],
    ['a module with no markerStyle', { markerStyle: null }],
    ['a module with no orientation', { orientation: null }],
    ['a module with no itemAlignment', { itemAlignment: null }],
  ])('rejects %s', (_case, overrides) => {
    const raw = { ...mockRawTimelineModule(), ...overrides };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('parses an item with no marker or body', () => {
    const raw = {
      ...mockRawTimelineModule(),
      items: [{ ...mockRawTimelineItem(), marker: null, body: null }],
    };

    const [item] = timelineModuleQuery.parse(raw).items;

    expect(item?.marker).toBeNull();
    expect(item?.body).toBeNull();
  });

  it.each([
    [
      NL,
      MOCK_HEADING[NL],
      MOCK_FIRST_HEADING[NL],
      MOCK_FIRST_BODY[NL],
      MOCK_SECOND_MARKER[EN],
    ],
    [
      FR,
      MOCK_HEADING[EN],
      MOCK_FIRST_HEADING[EN],
      MOCK_FIRST_BODY[EN],
      MOCK_SECOND_MARKER[FR],
    ],
  ])(
    'resolves the heading and each item for a %s visitor',
    async (locale, heading, firstHeading, firstBody, secondMarker) => {
      const timeline = await runTimeline(MOCK_TIMELINE_DOCUMENT, locale);

      expect(timeline).toEqual({
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: { heading, supportingText: null },
        markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
        items: [
          {
            _key: MOCK_FIRST_KEY,
            marker: MOCK_FIRST_MARKER,
            heading: firstHeading,
            body: mockParagraphBlocks(firstBody),
          },
          {
            _key: MOCK_SECOND_KEY,
            marker: secondMarker,
            heading: MOCK_SECOND_HEADING,
            body: mockParagraphBlocks(MOCK_SECOND_BODY),
          },
        ],
        orientation: TIMELINE_ORIENTATION.VERTICAL,
        ctaButtons: null,
        contentAlignment: null,
        itemAlignment: CONTENT_ALIGNMENT.LEFT,
        layout: null,
      });
    },
  );

  it('fails when an item heading is missing in both languages', async () => {
    const [first, second] = MOCK_TIMELINE_DOCUMENT.items;

    await expect(
      runTimeline(
        {
          ...MOCK_TIMELINE_DOCUMENT,
          items: [
            first,
            {
              ...second,
              heading: mockLocalizedStrings({ [FR]: faker.lorem.word() }),
            },
          ],
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
