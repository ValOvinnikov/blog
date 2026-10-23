import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_ABOUT_SLUG,
  MOCK_PRICING_SLUG,
} from '@blog/service/testing/shared/translated-pages-dataset';

import { sectionPagesQuery } from './query';

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
    ...(parent ? { parent: mockReference(parent) } : {}),
  };
}

const dataset = [
  landing('modules'),
  landing(MOCK_PRICING_SLUG, { parent: 'modules', orderRank: '0|b' }),
  landing('faq', { parent: 'modules', orderRank: '0|a' }),
  landing('billing', { parent: 'faq' }),
  landing(MOCK_ABOUT_SLUG),
  landing('faq-nl', { parent: 'modules', language: NL }),
];

async function run(parentId: string, locale: string) {
  const raw = await evaluateGroqExpression(
    sectionPagesQuery.query,
    dataset,
    undefined,
    { parentId, locale, defaultLocale: EN },
  );

  return sectionPagesQuery.parse(raw);
}

describe('sectionPagesQuery', () => {
  it('returns only the direct children of the hosting page, in drag order', async () => {
    const pages = await run('modules', EN);

    expect(pages.map(({ _id }) => _id)).toEqual(['faq', MOCK_PRICING_SLUG]);
  });

  it('returns only the children in the request language', async () => {
    const pages = await run('modules', NL);

    expect(pages.map(({ _id }) => _id)).toEqual(['faq-nl']);
  });

  it('returns nothing for a page without children', async () => {
    expect(await run(MOCK_ABOUT_SLUG, EN)).toEqual([]);
  });

  it('returns each child with its slug and heading block, and no unauthored image', async () => {
    const [faq] = await run('modules', EN);

    expect(faq).toMatchObject({
      slug: 'faq',
      headingBlock: { heading: 'faq', supportingText: 'faq summary' },
      image: null,
    });
  });
});
