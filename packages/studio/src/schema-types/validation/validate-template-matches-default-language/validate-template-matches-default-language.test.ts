import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { validateTemplateMatchesDefaultLanguage } from '@blog/studio/schema-types/validation/validate-template-matches-default-language/validate-template-matches-default-language';
import { evaluate, parse } from 'groq-js';
import type { Reference, SanityDocument, ValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const MISMATCH = 'This page uses a different template from its English page.';

const templateRef = (id: string): Reference => ({
  _type: 'reference',
  _ref: id,
});

const page = (_id: string, language: string, template?: string) =>
  ({
    _id,
    _type: PAGE_LANDING_TYPE,
    language,
    ...(template ? { template: templateRef(template) } : {}),
  }) as unknown as SanityDocument;

const metadata = (pages: { id: string; language: string }[]) => ({
  _id: 'meta-about',
  _type: 'translation.metadata',
  translations: pages.map(({ id, language }) => ({
    _key: language,
    language,
    value: { _type: 'reference', _ref: id },
  })),
});

const createContext = (document: SanityDocument, dataset: unknown[]) =>
  ({
    document,
    getClient: () => ({
      withConfig: () => ({
        fetch: async (query: string, params: Record<string, unknown>) => {
          const result = await evaluate(parse(query), { dataset, params });
          return result.get();
        },
      }),
    }),
  }) as unknown as ValidationContext;

describe(validateTemplateMatchesDefaultLanguage, () => {
  const englishPage = page('about-en', EN, 'template-about');
  const linked = metadata([
    { id: 'about-en', language: EN },
    { id: 'about-nl', language: NL },
  ]);

  it('passes a translation using the same template as its default-language page', async () => {
    const dutchPage = page('drafts.about-nl', NL, 'template-about');

    await expect(
      validateTemplateMatchesDefaultLanguage(
        templateRef('template-about'),
        createContext(dutchPage, [englishPage, dutchPage, linked]),
      ),
    ).resolves.toBe(true);
  });

  it('warns about a translation using a different template from its default-language page', async () => {
    const dutchPage = page('drafts.about-nl', NL, 'template-other');

    await expect(
      validateTemplateMatchesDefaultLanguage(
        templateRef('template-other'),
        createContext(dutchPage, [englishPage, dutchPage, linked]),
      ),
    ).resolves.toBe(MISMATCH);
  });

  it('passes the default-language page itself', async () => {
    await expect(
      validateTemplateMatchesDefaultLanguage(
        templateRef('template-about'),
        createContext(englishPage, [englishPage, linked]),
      ),
    ).resolves.toBe(true);
  });

  it('passes a page that is not linked to any translation', async () => {
    const dutchPage = page('about-nl', NL, 'template-other');

    await expect(
      validateTemplateMatchesDefaultLanguage(
        templateRef('template-other'),
        createContext(dutchPage, [englishPage, dutchPage]),
      ),
    ).resolves.toBe(true);
  });
});
