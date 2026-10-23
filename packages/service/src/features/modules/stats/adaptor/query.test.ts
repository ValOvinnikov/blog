import { BRAND_VARIANT, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_STATS_MODULE_ID,
  mockRawStatItem,
  mockRawStatsModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  mockLocalizedHeadingBlock,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';

import { statsModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const READERS_KEY = 'readers-stat';
const UPTIME_KEY = 'uptime-stat';
const HEADING = { [EN]: 'By the numbers', [NL]: 'In cijfers' };
const FOOTNOTE = { [EN]: 'Figures as of June.', [NL]: 'Cijfers per juni.' };
const DESCRIPTION = 'Per month';

const statsDocument = {
  _id: MOCK_STATS_MODULE_ID,
  _type: 'module_stats',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock(HEADING),
  stats: [
    {
      _key: READERS_KEY,
      _type: 'stat',
      value: mockLocalizedStrings({ [EN]: '1.2M', [NL]: '1,2 mln' }),
      label: mockLocalizedStrings({ [EN]: 'Readers', [NL]: 'Lezers' }),
      description: mockLocalizedStrings({ [EN]: DESCRIPTION }),
    },
    {
      _key: UPTIME_KEY,
      _type: 'stat',
      value: mockLocalizedStrings({ [EN]: '98%' }),
      label: mockLocalizedStrings({ [EN]: 'Uptime', [NL]: 'Beschikbaarheid' }),
    },
  ],
  footnote: mockLocalizedStrings(FOOTNOTE),
};

async function runStats(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    statsModuleQuery.query,
    [document],
    undefined,
    { id: MOCK_STATS_MODULE_ID, locale, defaultLocale: EN },
  );

  return statsModuleQuery.parse(raw);
}

describe('statsModuleQuery', () => {
  it('filters to module_stats documents by id', () => {
    expect(statsModuleQuery.query).toContain('_type == "module_stats"');
    expect(statsModuleQuery.query).toContain('_id == $id');
  });

  it.each([
    ['a module with no headingBlock', { headingBlock: null }],
    ['a module with no stats', { stats: null }],
    [
      'a stat with no value',
      { stats: [{ ...mockRawStatItem(), value: null }] },
    ],
    [
      'a stat with no label',
      { stats: [{ ...mockRawStatItem(), label: null }] },
    ],
  ])('rejects %s', (_case, overrides) => {
    const raw = { ...mockRawStatsModule(), ...overrides };

    expect(() => statsModuleQuery.parse(raw)).toThrow();
  });

  it('parses a stat with no description', () => {
    const raw = {
      ...mockRawStatsModule(),
      stats: [{ ...mockRawStatItem(), description: null }],
    };

    expect(statsModuleQuery.parse(raw).stats[0]?.description).toBeNull();
  });

  it('picks the heading, footnote and each stat in the visitor language', async () => {
    const stats = await runStats(statsDocument, NL);

    expect(stats).toEqual({
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: { heading: HEADING[NL], supportingText: null },
      footnote: FOOTNOTE[NL],
      stats: [
        {
          _key: READERS_KEY,
          value: '1,2 mln',
          label: 'Lezers',
          description: DESCRIPTION,
        },
        {
          _key: UPTIME_KEY,
          value: '98%',
          label: 'Beschikbaarheid',
          description: null,
        },
      ],
      ctaButtons: null,
      contentAlignment: null,
      layout: null,
    });
  });

  it('falls back to the default language for the heading, footnote and stats', async () => {
    const stats = await runStats(statsDocument, FR);

    expect(stats).toEqual({
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: { heading: HEADING[EN], supportingText: null },
      footnote: FOOTNOTE[EN],
      stats: [
        {
          _key: READERS_KEY,
          value: '1.2M',
          label: 'Readers',
          description: DESCRIPTION,
        },
        { _key: UPTIME_KEY, value: '98%', label: 'Uptime', description: null },
      ],
      ctaButtons: null,
      contentAlignment: null,
      layout: null,
    });
  });

  it('fails when a stat label is missing in both languages', async () => {
    const [first, second] = statsDocument.stats;

    await expect(
      runStats(
        {
          ...statsDocument,
          stats: [
            first,
            {
              ...second,
              label: mockLocalizedStrings({ [FR]: 'Disponibilité' }),
            },
          ],
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
