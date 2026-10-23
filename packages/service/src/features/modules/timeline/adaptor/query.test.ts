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

import { timelineModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const FIRST_KEY = 'kick-off-item';
const SECOND_KEY = 'ship-item';
const HEADING = { [EN]: 'How it works', [NL]: 'Hoe het werkt' };
const FIRST_MARKER = 'Week 1';
const FIRST_HEADING = { [EN]: 'Kick off', [NL]: 'Aftrap' };
const FIRST_BODY = { [EN]: 'The project begins.', [NL]: 'Het project begint.' };
const SECOND_MARKER = { [EN]: 'Week 2', [FR]: 'Semaine 2' };
const SECOND_HEADING = 'Ship';
const SECOND_BODY = 'It goes live.';

const timelineDocument = {
  _id: MOCK_TIMELINE_MODULE_ID,
  _type: 'module_timeline',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock(HEADING),
  markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
  items: [
    {
      _key: FIRST_KEY,
      _type: 'timelineItem',
      marker: mockLocalizedStrings({ [EN]: FIRST_MARKER, [NL]: FIRST_MARKER }),
      heading: mockLocalizedStrings(FIRST_HEADING),
      body: mockLocalizedParagraphText(FIRST_BODY),
    },
    {
      _key: SECOND_KEY,
      _type: 'timelineItem',
      marker: mockLocalizedStrings(SECOND_MARKER),
      heading: mockLocalizedStrings({ [EN]: SECOND_HEADING }),
      body: mockLocalizedParagraphText({ [EN]: SECOND_BODY }),
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
  it('filters to module_timeline documents by id', () => {
    expect(timelineModuleQuery.query).toContain('_type == "module_timeline"');
    expect(timelineModuleQuery.query).toContain('_id == $id');
  });

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
    [NL, HEADING[NL], FIRST_HEADING[NL], FIRST_BODY[NL], SECOND_MARKER[EN]],
    [FR, HEADING[EN], FIRST_HEADING[EN], FIRST_BODY[EN], SECOND_MARKER[FR]],
  ])(
    'resolves the heading and each item for a %s visitor',
    async (locale, heading, firstHeading, firstBody, secondMarker) => {
      const timeline = await runTimeline(timelineDocument, locale);

      expect(timeline).toEqual({
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: { heading, supportingText: null },
        markerStyle: TIMELINE_MARKER_STYLE.LABELLED,
        items: [
          {
            _key: FIRST_KEY,
            marker: FIRST_MARKER,
            heading: firstHeading,
            body: mockParagraphBlocks(firstBody),
          },
          {
            _key: SECOND_KEY,
            marker: secondMarker,
            heading: SECOND_HEADING,
            body: mockParagraphBlocks(SECOND_BODY),
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
    const [first, second] = timelineDocument.items;

    await expect(
      runTimeline(
        {
          ...timelineDocument,
          items: [
            first,
            { ...second, heading: mockLocalizedStrings({ [FR]: 'Lancement' }) },
          ],
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
