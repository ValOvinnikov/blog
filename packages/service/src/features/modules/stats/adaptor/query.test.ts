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
import { faker } from '@faker-js/faker';

import { statsModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

faker.seed(2);

const MOCK_READERS_KEY = faker.string.uuid();
const MOCK_UPTIME_KEY = faker.string.uuid();
const MOCK_HEADING = { [EN]: faker.lorem.words(3), [NL]: faker.lorem.words(3) };
const MOCK_FOOTNOTE = {
  [EN]: faker.lorem.sentence(),
  [NL]: faker.lorem.sentence(),
};
const MOCK_DESCRIPTION = faker.lorem.words(2);
const MOCK_READERS_VALUE = {
  [EN]: faker.string.numeric(4),
  [NL]: faker.string.numeric(4),
};
const MOCK_READERS_LABEL = {
  [EN]: faker.lorem.word(),
  [NL]: faker.lorem.word(),
};
const MOCK_UPTIME_VALUE = faker.string.numeric(2);
const MOCK_UPTIME_LABEL = {
  [EN]: faker.lorem.word(),
  [NL]: faker.lorem.word(),
};

const MOCK_STATS_DOCUMENT = {
  _id: MOCK_STATS_MODULE_ID,
  _type: 'module_stats',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
  stats: [
    {
      _key: MOCK_READERS_KEY,
      _type: 'stat',
      value: mockLocalizedStrings(MOCK_READERS_VALUE),
      label: mockLocalizedStrings(MOCK_READERS_LABEL),
      description: mockLocalizedStrings({ [EN]: MOCK_DESCRIPTION }),
    },
    {
      _key: MOCK_UPTIME_KEY,
      _type: 'stat',
      value: mockLocalizedStrings({ [EN]: MOCK_UPTIME_VALUE }),
      label: mockLocalizedStrings(MOCK_UPTIME_LABEL),
    },
  ],
  footnote: mockLocalizedStrings(MOCK_FOOTNOTE),
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

const EMPTY_OPTIONALS = {
  ctaButtons: null,
  contentAlignment: null,
  layout: null,
};

describe('statsModuleQuery', () => {
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
    const stats = await runStats(MOCK_STATS_DOCUMENT, NL);

    expect(stats).toEqual({
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: { heading: MOCK_HEADING[NL], supportingText: null },
      footnote: MOCK_FOOTNOTE[NL],
      stats: [
        {
          _key: MOCK_READERS_KEY,
          value: MOCK_READERS_VALUE[NL],
          label: MOCK_READERS_LABEL[NL],
          description: MOCK_DESCRIPTION,
        },
        {
          _key: MOCK_UPTIME_KEY,
          value: MOCK_UPTIME_VALUE,
          label: MOCK_UPTIME_LABEL[NL],
          description: null,
        },
      ],
      ...EMPTY_OPTIONALS,
    });
  });

  it('falls back to the default language when the visitor language is missing', async () => {
    const stats = await runStats(MOCK_STATS_DOCUMENT, FR);

    expect(stats).toEqual({
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: { heading: MOCK_HEADING[EN], supportingText: null },
      footnote: MOCK_FOOTNOTE[EN],
      stats: [
        {
          _key: MOCK_READERS_KEY,
          value: MOCK_READERS_VALUE[EN],
          label: MOCK_READERS_LABEL[EN],
          description: MOCK_DESCRIPTION,
        },
        {
          _key: MOCK_UPTIME_KEY,
          value: MOCK_UPTIME_VALUE,
          label: MOCK_UPTIME_LABEL[EN],
          description: null,
        },
      ],
      ...EMPTY_OPTIONALS,
    });
  });

  it('fails when a stat label is missing in both languages', async () => {
    const [first, second] = MOCK_STATS_DOCUMENT.stats;
    const document = {
      ...MOCK_STATS_DOCUMENT,
      stats: [
        first,
        {
          ...second,
          label: mockLocalizedStrings({ [FR]: faker.lorem.word() }),
        },
      ],
    };

    await expect(runStats(document, NL)).rejects.toThrow();
  });
});
