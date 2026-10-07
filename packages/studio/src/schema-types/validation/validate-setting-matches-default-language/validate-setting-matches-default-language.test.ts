import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { validateSettingMatchesDefaultLanguage } from '@blog/studio/schema-types/validation/validate-setting-matches-default-language/validate-setting-matches-default-language';
import { evaluate, parse } from 'groq-js';
import type { SanityDocument, ValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const MISMATCH = '"Show sidebar" is set differently from its English page.';

const validate = validateSettingMatchesDefaultLanguage({
  field: 'showSidebar',
  title: 'Show sidebar',
  initialValue: true,
});

const page = (_id: string, language: string, showSidebar?: boolean) =>
  ({
    _id,
    _type: PAGE_LANDING_TYPE,
    language,
    ...(showSidebar === undefined ? {} : { showSidebar }),
  }) as unknown as SanityDocument;

const linked = {
  _id: 'meta-about',
  _type: 'translation.metadata',
  translations: [
    { id: 'about-en', language: EN },
    { id: 'about-nl', language: NL },
  ].map(({ id, language }) => ({
    _key: language,
    language,
    value: { _type: 'reference', _ref: id },
  })),
};

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

describe(validateSettingMatchesDefaultLanguage, () => {
  let dutchPage: SanityDocument;

  beforeEach(() => {
    dutchPage = page('drafts.about-nl', NL, false);
  });

  it('passes a translation with the same value as its default-language page', async () => {
    await expect(
      validate(
        false,
        createContext(dutchPage, [
          page('about-en', EN, false),
          dutchPage,
          linked,
        ]),
      ),
    ).resolves.toBe(true);
  });

  it('warns about a translation with a different value from its default-language page', async () => {
    await expect(
      validate(
        false,
        createContext(dutchPage, [
          page('about-en', EN, true),
          dutchPage,
          linked,
        ]),
      ),
    ).resolves.toBe(MISMATCH);
  });

  it('treats an unset value as the initial value on either page', async () => {
    const unsetDutchPage = page('drafts.about-nl', NL);

    await expect(
      validate(
        undefined,
        createContext(unsetDutchPage, [
          page('about-en', EN, true),
          unsetDutchPage,
          linked,
        ]),
      ),
    ).resolves.toBe(true);
  });

  it('warns when an unset default-language value differs from the translation', async () => {
    await expect(
      validate(
        false,
        createContext(dutchPage, [page('about-en', EN), dutchPage, linked]),
      ),
    ).resolves.toBe(MISMATCH);
  });

  it('passes the default-language page itself', async () => {
    const englishPage = page('about-en', EN, false);

    await expect(
      validate(false, createContext(englishPage, [englishPage, linked])),
    ).resolves.toBe(true);
  });

  it('passes a page that is not linked to any translation', async () => {
    const unlinkedDutchPage = page('about-nl', NL, false);

    await expect(
      validate(
        false,
        createContext(unlinkedDutchPage, [
          page('about-en', EN, true),
          unlinkedDutchPage,
        ]),
      ),
    ).resolves.toBe(true);
  });
});
