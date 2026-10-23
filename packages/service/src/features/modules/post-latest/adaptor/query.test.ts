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

const moduleDocument = mockModuleDocument({
  _type: 'module_postLatest',
  limit: 3,
});

async function runPostLatest(locale: string) {
  const raw = await evaluateGroqExpression(
    postLatestModuleQuery.query,
    [moduleDocument],
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

  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runPostLatest(NL);

    expect(headingBlock.heading).toBe(MOCK_DUTCH_MODULE_HEADING);
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runPostLatest(FR);

    expect(headingBlock.heading).toBe(MOCK_ENGLISH_MODULE_HEADING);
  });
});
