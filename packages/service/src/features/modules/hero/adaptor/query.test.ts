import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { pinnedPostDocuments } from '@blog/service/testing/shared/translated-posts-dataset';

import { heroModuleQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

async function runFeaturedPost(ref: string, locale: string) {
  const raw = (await evaluateGroqExpression(
    heroModuleQuery.query,
    [
      {
        _id: 'hero-1',
        _type: 'module_hero',
        featuredPost: { _type: 'reference', _ref: ref },
      },
      ...pinnedPostDocuments,
    ],
    undefined,
    { id: 'hero-1', locale, defaultLocale: EN },
  )) as { featuredPost: { _id: string } | null };

  return raw.featuredPost?._id ?? null;
}

describe('heroModuleQuery featured post language', () => {
  it('shows the featured post in its own language', async () => {
    expect(await runFeaturedPost('design-en', EN)).toBe('design-en');
  });

  it('swaps the featured post for its translation', async () => {
    expect(await runFeaturedPost('design-en', NL)).toBe('design-nl');
  });

  it('shows no post when the featured one has no translation', async () => {
    expect(await runFeaturedPost('only-en', NL)).toBeNull();
  });

  it('shows a featured post without a translation group in its own language', async () => {
    expect(await runFeaturedPost('solo-nl', NL)).toBe('solo-nl');
  });

  it('shows no post for a group-less featured post in another language', async () => {
    expect(await runFeaturedPost('solo-nl', EN)).toBeNull();
  });
});
