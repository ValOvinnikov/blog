import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { childPagesQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

function landing(
  id: string,
  options: { parent?: string; orderRank?: string; language?: string } = {},
) {
  const { parent, orderRank = id, language = EN } = options;

  return {
    _id: id,
    _type: 'page_landing',
    slug: { current: id },
    language,
    orderRank,
    headingBlock: { heading: id, supportingText: `${id} summary` },
    ...(parent ? { parent: { _type: 'reference', _ref: parent } } : {}),
  };
}

const dataset = [
  landing('modules'),
  landing('pricing', { parent: 'modules', orderRank: '0|b' }),
  landing('faq', { parent: 'modules', orderRank: '0|a' }),
  landing('billing', { parent: 'faq' }),
  landing('about'),
  landing('faq-nl', { parent: 'modules', language: NL }),
];

async function run(parentId: string, locale: string) {
  const raw = await evaluateGroqExpression(
    childPagesQuery.query,
    dataset,
    undefined,
    { parentId, locale, defaultLocale: EN },
  );

  return childPagesQuery.parse(raw);
}

describe('childPagesQuery', () => {
  it('returns only the direct children of the hosting page, in drag order', async () => {
    const pages = await run('modules', EN);

    expect(pages.map(({ _id }) => _id)).toEqual(['faq', 'pricing']);
  });

  it('returns only the children in the request language', async () => {
    const pages = await run('modules', NL);

    expect(pages.map(({ _id }) => _id)).toEqual(['faq-nl']);
  });

  it('returns nothing for a page without children', async () => {
    expect(await run('about', EN)).toEqual([]);
  });

  it('returns each child with its slug, heading block and no image when none is authored', async () => {
    const [faq] = await run('modules', EN);

    expect(faq).toMatchObject({
      slug: 'faq',
      headingBlock: { heading: 'faq', supportingText: 'faq summary' },
      image: null,
    });
  });
});
