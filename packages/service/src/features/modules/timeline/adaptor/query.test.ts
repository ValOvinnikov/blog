import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  makeRawTimelineItem,
  makeRawTimelineModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  localizedStrings,
  localizedValues,
  paragraphBlocks,
} from '@blog/service/testing/shared/localized';

import { timelineModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

function localizedParagraphs(values: Partial<Record<string, string>>) {
  return localizedValues(
    'internationalizedArrayParagraphTextValue',
    Object.fromEntries(
      Object.entries(values).map(([language, text]) => [
        language,
        paragraphBlocks(text ?? ''),
      ]),
    ),
  );
}

const timelineDocument = {
  _id: 'timeline-1',
  _type: 'module_timeline',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: localizedStrings({ [EN]: 'How it works', [NL]: 'Hoe het werkt' }),
  },
  markerStyle: 'LABELLED',
  items: [
    {
      _key: 'item-1',
      _type: 'timelineItem',
      marker: localizedStrings({ [EN]: 'Week 1', [NL]: 'Week 1' }),
      heading: localizedStrings({ [EN]: 'Kick off', [NL]: 'Aftrap' }),
      body: localizedParagraphs({
        [EN]: 'The project begins.',
        [NL]: 'Het project begint.',
      }),
    },
    {
      _key: 'item-2',
      _type: 'timelineItem',
      marker: localizedStrings({ [EN]: 'Week 2', [FR]: 'Semaine 2' }),
      heading: localizedStrings({ [EN]: 'Ship' }),
      body: localizedParagraphs({ [EN]: 'It goes live.' }),
    },
  ],
  orientation: 'VERTICAL',
  itemAlignment: 'LEFT',
};

async function runTimeline(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    timelineModuleQuery.query,
    [document],
    undefined,
    { id: 'timeline-1', locale, defaultLocale: EN },
  );

  return timelineModuleQuery.parse(raw);
}

describe('timelineModuleQuery', () => {
  it('filters to module_timeline documents by id', () => {
    expect(timelineModuleQuery.query).toContain('_type == "module_timeline"');
    expect(timelineModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawTimelineModule(), headingBlock: null };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no items', () => {
    const raw = { ...makeRawTimelineModule(), items: null };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('rejects an item with no heading', () => {
    const raw = {
      ...makeRawTimelineModule(),
      items: [{ ...makeRawTimelineItem(), heading: null }],
    };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('parses an item with no marker or body', () => {
    const raw = {
      ...makeRawTimelineModule(),
      items: [{ ...makeRawTimelineItem(), marker: null, body: null }],
    };

    expect(() => timelineModuleQuery.parse(raw)).not.toThrow();
    const parsed = timelineModuleQuery.parse(raw).items?.[0];
    expect(parsed?.marker).toBeNull();
    expect(parsed?.body).toBeNull();
  });

  it('rejects a module with no markerStyle', () => {
    const raw = { ...makeRawTimelineModule(), markerStyle: null };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no orientation', () => {
    const raw = { ...makeRawTimelineModule(), orientation: null };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no itemAlignment', () => {
    const raw = { ...makeRawTimelineModule(), itemAlignment: null };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('picks the heading and each item in the visitor language', async () => {
    const timeline = await runTimeline(timelineDocument, NL);

    expect(timeline).toMatchObject({
      headingBlock: { heading: 'Hoe het werkt' },
      items: [
        {
          marker: 'Week 1',
          heading: 'Aftrap',
          body: [{ children: [{ text: 'Het project begint.' }] }],
        },
        {
          marker: 'Week 2',
          heading: 'Ship',
          body: [{ children: [{ text: 'It goes live.' }] }],
        },
      ],
    });
  });

  it('falls back to the default language for the heading and each item', async () => {
    const timeline = await runTimeline(timelineDocument, FR);

    expect(timeline).toMatchObject({
      headingBlock: { heading: 'How it works' },
      items: [
        {
          marker: 'Week 1',
          heading: 'Kick off',
          body: [{ children: [{ text: 'The project begins.' }] }],
        },
        {
          marker: 'Semaine 2',
          heading: 'Ship',
          body: [{ children: [{ text: 'It goes live.' }] }],
        },
      ],
    });
  });

  it('fails when an item heading is missing in both languages', async () => {
    const [first, second] = timelineDocument.items;

    await expect(
      runTimeline(
        {
          ...timelineDocument,
          items: [
            first,
            { ...second, heading: localizedStrings({ [FR]: 'Lancement' }) },
          ],
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
