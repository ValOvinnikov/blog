import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { childPagesQuery } from './pages.query';

const { EN, NL } = LOCALE_ISO_CODES;

function landing(
  id: string,
  slug: string,
  options: { parent?: string; orderRank?: string; language?: string } = {},
) {
  const { parent, orderRank = id, language = EN } = options;

  return {
    _id: id,
    _type: 'page_landing',
    slug: { current: slug },
    language,
    orderRank,
    headingBlock: { heading: id, supportingText: `${id} summary` },
    ...(parent ? { parent: { _type: 'reference', _ref: parent } } : {}),
  };
}

const dataset = [
  landing('modules', 'modules'),
  landing('pricing', 'pricing', { parent: 'modules', orderRank: '0|b' }),
  landing('faq', 'faq', { parent: 'modules', orderRank: '0|a' }),
  landing('faq-billing', 'billing', { parent: 'faq' }),
  landing('about', 'about'),
  landing('modules-nl', 'modules', { language: NL }),
  landing('faq-nl', 'faq', { parent: 'modules-nl', language: NL }),
  landing('orphan', 'orphan', { parent: 'deleted-page' }),
];

async function run(parentPath: string, locale: string) {
  const raw = await evaluateGroqExpression(
    childPagesQuery.query,
    dataset,
    undefined,
    { parentPath, locale, defaultLocale: EN },
  );

  return childPagesQuery.parse(raw);
}

describe('childPagesQuery', () => {
  it('returns the direct children of the page at the path in drag order, with full paths', async () => {
    const pages = await run('modules', EN);

    expect(pages.map(({ _id, path }) => ({ _id, path }))).toEqual([
      { _id: 'faq', path: 'modules/faq' },
      { _id: 'pricing', path: 'modules/pricing' },
    ]);
  });

  it('returns the children of a nested page', async () => {
    const pages = await run('modules/faq', EN);

    expect(pages.map(({ path }) => path)).toEqual(['modules/faq/billing']);
  });

  it('returns only the children in the request language', async () => {
    const pages = await run('modules', NL);

    expect(pages.map(({ _id }) => _id)).toEqual(['faq-nl']);
  });

  it('returns nothing for a page without children', async () => {
    expect(await run('about', EN)).toEqual([]);
  });

  it('returns each child with its heading block and no image when none is authored', async () => {
    const [faq] = await run('modules', EN);

    expect(faq).toMatchObject({
      headingBlock: { heading: 'faq', supportingText: 'faq summary' },
      image: null,
    });
  });
});
