import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  makeRawStatItem,
  makeRawStatsModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { statsModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const statsDocument = {
  _id: 'stats-1',
  _type: 'module_stats',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'localizedHeadingBlock',
    heading: localizedStrings({ [EN]: 'By the numbers', [NL]: 'In cijfers' }),
  },
  stats: [
    {
      _key: 'stat-1',
      _type: 'stat',
      value: localizedStrings({ [EN]: '1.2M', [NL]: '1,2 mln' }),
      label: localizedStrings({ [EN]: 'Readers', [NL]: 'Lezers' }),
      description: localizedStrings({ [EN]: 'Per month' }),
    },
    {
      _key: 'stat-2',
      _type: 'stat',
      value: localizedStrings({ [EN]: '98%' }),
      label: localizedStrings({ [EN]: 'Uptime', [NL]: 'Beschikbaarheid' }),
    },
  ],
  footnote: localizedStrings({
    [EN]: 'Figures as of June.',
    [NL]: 'Cijfers per juni.',
  }),
};

async function runStats(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    statsModuleQuery.query,
    [document],
    undefined,
    { id: 'stats-1', locale, defaultLocale: EN },
  );

  return statsModuleQuery.parse(raw);
}

describe('statsModuleQuery', () => {
  it('filters to module_stats documents by id', () => {
    expect(statsModuleQuery.query).toContain('_type == "module_stats"');
    expect(statsModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawStatsModule(), headingBlock: null };

    expect(() => statsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no stats', () => {
    const raw = { ...makeRawStatsModule(), stats: null };

    expect(() => statsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a stat with no value', () => {
    const raw = {
      ...makeRawStatsModule(),
      stats: [{ ...makeRawStatItem(), value: null }],
    };

    expect(() => statsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a stat with no label', () => {
    const raw = {
      ...makeRawStatsModule(),
      stats: [{ ...makeRawStatItem(), label: null }],
    };

    expect(() => statsModuleQuery.parse(raw)).toThrow();
  });

  it('parses a stat with no description', () => {
    const raw = {
      ...makeRawStatsModule(),
      stats: [{ ...makeRawStatItem(), description: null }],
    };

    expect(() => statsModuleQuery.parse(raw)).not.toThrow();
    expect(statsModuleQuery.parse(raw).stats?.[0]?.description).toBeNull();
  });

  it('picks the heading, footnote and each stat in the visitor language', async () => {
    const stats = await runStats(statsDocument, NL);

    expect(stats).toMatchObject({
      headingBlock: { heading: 'In cijfers' },
      footnote: 'Cijfers per juni.',
      stats: [
        { value: '1,2 mln', label: 'Lezers', description: 'Per month' },
        { value: '98%', label: 'Beschikbaarheid', description: null },
      ],
    });
  });

  it('falls back to the default language for the heading, footnote and stats', async () => {
    const stats = await runStats(statsDocument, FR);

    expect(stats).toMatchObject({
      headingBlock: { heading: 'By the numbers' },
      footnote: 'Figures as of June.',
      stats: [
        { value: '1.2M', label: 'Readers', description: 'Per month' },
        { value: '98%', label: 'Uptime', description: null },
      ],
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
            { ...second, label: localizedStrings({ [FR]: 'Disponibilité' }) },
          ],
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
