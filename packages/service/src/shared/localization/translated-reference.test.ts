import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { buildTranslatedReferenceExpression } from './translated-reference';

const { EN, NL, FR } = LOCALE_ISO_CODES;

function page(id: string, language: string) {
  return { _id: id, _type: 'page_landing', language };
}

function translation(id: string, language: string) {
  return {
    _key: language,
    language,
    value: { _type: 'reference', _ref: id },
  };
}

const dataset = [
  page('about-en', EN),
  page('about-nl', NL),
  page('contact-en', EN),
  {
    _id: 'meta-about',
    _type: 'translation.metadata',
    translations: [translation('about-en', EN), translation('about-nl', NL)],
  },
];

function resolveId(pageId: string, locale: string): Promise<unknown> {
  return evaluateGroqExpression(
    `${buildTranslatedReferenceExpression('page')}._id`,
    dataset,
    { page: { _type: 'reference', _ref: pageId } },
    { locale, defaultLocale: EN },
  );
}

describe(buildTranslatedReferenceExpression, () => {
  it('resolves to the translation in the requested language', async () => {
    expect(await resolveId('about-en', NL)).toBe('about-nl');
  });

  it('falls back to the default-language page when no translation exists', async () => {
    expect(await resolveId('about-en', FR)).toBe('about-en');
  });

  it('resolves from a translation back to the requested language', async () => {
    expect(await resolveId('about-nl', EN)).toBe('about-en');
  });

  it('resolves to the referenced page when it has no translations at all', async () => {
    expect(await resolveId('contact-en', NL)).toBe('contact-en');
  });
});
