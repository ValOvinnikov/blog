import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { buildTranslationsExpression } from './translations';

const { EN, NL } = LOCALE_ISO_CODES;

function page(id: string, language: string | undefined, slug: string) {
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
const contact = page('contact', undefined, 'contact');

const dataset = [
  aboutEn,
  aboutNl,
  contact,
  {
    _id: 'meta-about',
    _type: 'translation.metadata',
    translations: [translation('about-en', EN), translation('about-nl', NL)],
  },
];

function resolve(root: unknown): Promise<unknown> {
  return evaluateGroqExpression(buildTranslationsExpression(), dataset, root, {
    locale: EN,
    defaultLocale: EN,
  });
}

describe(buildTranslationsExpression, () => {
  it('lists every language the page is linked in, itself included', async () => {
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

  it('lists only the page itself, in the default language, when it has no translation metadata', async () => {
    expect(await resolve(contact)).toEqual([{ language: EN, slug: 'contact' }]);
  });
});
