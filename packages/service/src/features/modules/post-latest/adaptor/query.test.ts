import { DISPLAY_MODE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_DUTCH_MODULE_HEADING,
  MOCK_ENGLISH_MODULE_HEADING,
  MOCK_MODULE_ID,
  mockModuleDocument,
  mockRawPostLatestModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { postLatestModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_LIMIT = 3;
const MOCK_MODULE_DOCUMENT = mockModuleDocument({
  _type: 'module_postLatest',
  limit: MOCK_LIMIT,
});

async function runPostLatest(locale: string) {
  const raw = await evaluateGroqExpression(
    postLatestModuleQuery.query,
    [MOCK_MODULE_DOCUMENT],
    undefined,
    { id: MOCK_MODULE_ID, locale, defaultLocale: EN },
  );

  return postLatestModuleQuery.parse(raw);
}

describe('postLatestModuleQuery', () => {
  it('rejects a module with no headingBlock', () => {
    const raw = { ...mockRawPostLatestModule(), headingBlock: null };

    expect(() => postLatestModuleQuery.parse(raw)).toThrow();
  });

  it('defaults showImages and displayMode for a document authored without them', async () => {
    const { showImages, displayMode } = await runPostLatest(EN);

    expect(showImages).toBe(true);
    expect(displayMode).toBe(DISPLAY_MODE.GRID);
  });

  it.each([
    [NL, MOCK_DUTCH_MODULE_HEADING],
    [FR, MOCK_ENGLISH_MODULE_HEADING],
  ])('resolves the heading text for a %s visitor', async (locale, expected) => {
    const { headingBlock } = await runPostLatest(locale);

    expect(headingBlock.heading).toBe(expected);
  });
});
