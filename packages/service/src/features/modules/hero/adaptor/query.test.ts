import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_HERO_MODULE_ID } from '@blog/service/testing/pages/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_DESIGN_EN_POST_ID,
  MOCK_DESIGN_NL_POST_ID,
  MOCK_ONLY_EN_POST_ID,
  MOCK_PINNED_POST_DOCUMENTS,
  MOCK_SOLO_NL_POST_ID,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { heroModuleQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

async function runFeaturedPost(ref: string, locale: string) {
  const raw = (await evaluateGroqExpression(
    heroModuleQuery.query,
    [
      {
        _id: MOCK_HERO_MODULE_ID,
        _type: 'module_hero',
        featuredPost: mockReference(ref),
      },
      ...MOCK_PINNED_POST_DOCUMENTS,
    ],
    undefined,
    { id: MOCK_HERO_MODULE_ID, locale, defaultLocale: EN },
  )) as { featuredPost: { _id: string } | null };

  return raw.featuredPost?._id ?? null;
}

describe('heroModuleQuery featured post language', () => {
  it.each([
    [
      'shows the featured post in its own language',
      MOCK_DESIGN_EN_POST_ID,
      EN,
      MOCK_DESIGN_EN_POST_ID,
    ],
    [
      'swaps the featured post for its translation',
      MOCK_DESIGN_EN_POST_ID,
      NL,
      MOCK_DESIGN_NL_POST_ID,
    ],
    [
      'shows no post when the featured one has no translation',
      MOCK_ONLY_EN_POST_ID,
      NL,
      null,
    ],
    [
      'shows a group-less featured post in its own language',
      MOCK_SOLO_NL_POST_ID,
      NL,
      MOCK_SOLO_NL_POST_ID,
    ],
    [
      'shows no post for a group-less featured post in another language',
      MOCK_SOLO_NL_POST_ID,
      EN,
      null,
    ],
  ])('%s', async (_, ref, locale, expected) => {
    expect(await runFeaturedPost(ref, locale)).toBe(expected);
  });
});
