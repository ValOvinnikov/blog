import { BRAND_VARIANT, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_DUTCH_MODULE_HEADING,
  MOCK_ENGLISH_MODULE_HEADING,
  MOCK_MODULE_ID,
  mockModuleDocument,
  mockRawPostRelatedModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { postRelatedModuleQuery } from './query';

faker.seed(22);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_LIMIT = faker.number.int({ min: 1, max: 12 });

const MOCK_MODULE_DOCUMENT = mockModuleDocument({
  _type: 'module_postRelated',
  limit: MOCK_LIMIT,
});

async function runPostRelated(locale: string) {
  const raw = await evaluateGroqExpression(
    postRelatedModuleQuery.query,
    [MOCK_MODULE_DOCUMENT],
    undefined,
    { id: MOCK_MODULE_ID, locale, defaultLocale: EN },
  );

  return postRelatedModuleQuery.parse(raw);
}

describe('postRelatedModuleQuery', () => {
  it('rejects a module with no headingBlock', () => {
    const raw = { ...mockRawPostRelatedModule(), headingBlock: null };

    expect(() => postRelatedModuleQuery.parse(raw)).toThrow();
  });

  describe('in English', () => {
    let postRelated: Awaited<ReturnType<typeof runPostRelated>>;

    beforeEach(async () => {
      postRelated = await runPostRelated(EN);
    });

    it('reads brandVariant and limit', () => {
      const { brandVariant, limit } = postRelated;

      expect(brandVariant).toBe(BRAND_VARIANT.PRIMARY);
      expect(limit).toBe(MOCK_LIMIT);
    });

    it('defaults showImages to true for a document authored without it', () => {
      expect(postRelated.showImages).toBe(true);
    });
  });

  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runPostRelated(NL);

    expect(headingBlock.heading).toBe(MOCK_DUTCH_MODULE_HEADING);
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runPostRelated(FR);

    expect(headingBlock.heading).toBe(MOCK_ENGLISH_MODULE_HEADING);
  });
});
