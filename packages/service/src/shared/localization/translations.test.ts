import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { TRANSLATIONS_EXPRESSION } from './translations';

const { EN, NL } = LOCALE_ISO_CODES;

function page(id: string, language: string, slug: string) {
  return { _id: id, _type: 'page_landing', language, slug: { current: slug } };
}

function translation(id: string, language: string) {
  return {
    _key: language,
    language,
    value: { _type: 'reference', _ref: id },
  };
}

const aboutEn = page('about-en', EN, 'about');
const aboutNl = page('about-nl', NL, 'over-ons');
const contact = page('contact', EN, 'contact');
const pricing = page('pricing-en', EN, 'pricing');

const dataset = [
  aboutEn,
  aboutNl,
  contact,
  pricing,
  {
    _id: 'meta-about',
    _type: 'translation.metadata',
    translations: [translation('about-en', EN), translation('about-nl', NL)],
  },
  {
    _id: 'meta-pricing',
    _type: 'translation.metadata',
    translations: [
      translation('pricing-en', EN),
      translation('pricing-nl', NL),
    ],
  },
];

function resolve(root: unknown): Promise<unknown> {
  return evaluateGroqExpression(TRANSLATIONS_EXPRESSION, dataset, root);
}

describe('TRANSLATIONS_EXPRESSION', () => {
  it('lists every translation, the page itself included', async () => {
    expect(await resolve(aboutEn)).toEqual([
      { language: EN, slug: 'about' },
      { language: NL, slug: 'over-ons' },
    ]);
  });

  it('lists the same set from a translation', async () => {
    expect(await resolve(aboutNl)).toEqual([
      { language: EN, slug: 'about' },
      { language: NL, slug: 'over-ons' },
    ]);
  });

  it('is empty when the page has no translation metadata', async () => {
    expect(await resolve(contact)).toEqual([]);
  });

  it('skips a translation that is not published', async () => {
    expect(await resolve(pricing)).toEqual([{ language: EN, slug: 'pricing' }]);
  });
});
