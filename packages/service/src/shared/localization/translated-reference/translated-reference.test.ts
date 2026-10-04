import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { translatedReference } from './translated-reference';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const localeQ = q.parameters<TLocaleParams>();

const query = localeQ.star
  .filterByType('link')
  .slice(0)
  .project((sub) => ({
    target: translatedReference(
      sub,
      (filter) =>
        sub
          .field('internalReference')
          .deref()
          .project(() => ({
            translated: localeQ.star
              .filterByType('translation.metadata')
              .filterRaw('references(^._id)')
              .slice(0)
              .field('translations[]')
              .filterBy(filter)
              .slice(0)
              .field('value')
              .deref()
              .project(() => ({ _id: true })),
          }))
          .field('translated'),
      sub
        .field('internalReference')
        .deref()
        .project(() => ({ _id: true })),
    ),
  }));

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
    query.query,
    [
      {
        _id: 'link-1',
        _type: 'link',
        internalReference: { _type: 'reference', _ref: pageId },
      },
      ...dataset,
    ],
    undefined,
    { locale, defaultLocale: EN },
  );
}

describe(translatedReference, () => {
  it('resolves to the translation in the requested language', async () => {
    expect(await resolveId('about-en', NL)).toMatchObject({
      target: { _id: 'about-nl' },
    });
  });

  it('falls back to the default-language page when no translation exists', async () => {
    expect(await resolveId('about-en', FR)).toMatchObject({
      target: { _id: 'about-en' },
    });
  });

  it('resolves from a translation back to the requested language', async () => {
    expect(await resolveId('about-nl', EN)).toMatchObject({
      target: { _id: 'about-en' },
    });
  });

  it('resolves to the referenced page when it has no translations at all', async () => {
    expect(await resolveId('contact-en', NL)).toMatchObject({
      target: { _id: 'contact-en' },
    });
  });
});
