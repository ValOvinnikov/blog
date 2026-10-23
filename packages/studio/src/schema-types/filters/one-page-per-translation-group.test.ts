import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { onePagePerTranslationGroupFilter } from '@blog/studio/schema-types/filters/one-page-per-translation-group';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import {
  mockLandingPage,
  mockTranslationMetadata,
} from '@blog/studio/testing/mock-documents';
import { evaluate, parse } from 'groq-js';
import type { SanityDocument } from 'sanity';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MODULES_EN_ID = 'modules-en';
const MODULES_NL_ID = 'modules-nl';
const PRICING_NL_ID = 'pricing-nl';
const PRICING_FR_ID = 'pricing-fr';

const offeredPages = async (dataset: Record<string, unknown>[]) => {
  const { filter, params } = onePagePerTranslationGroupFilter();
  const query = `*[_type == $type && ${filter}] | order(_id asc)._id`;
  const queryParams = { ...params, type: PAGE_LANDING_TYPE };
  const result = await evaluate(parse(query, { params: queryParams }), {
    dataset,
    params: queryParams,
  });

  return result.get();
};

describe(onePagePerTranslationGroupFilter, () => {
  let modulesEn: SanityDocument;
  let modulesNl: SanityDocument;
  let modulesGroup: ReturnType<typeof mockTranslationMetadata>;

  beforeEach(() => {
    modulesEn = mockLandingPage({ _id: MODULES_EN_ID, language: EN });
    modulesNl = mockLandingPage({ _id: MODULES_NL_ID, language: NL });
    modulesGroup = mockTranslationMetadata([
      [MODULES_EN_ID, EN],
      [MODULES_NL_ID, NL],
    ]);
  });

  afterEach(() => {
    setDefaultLanguage(EN);
  });

  it('offers a page translated into two languages once, as its default-language document', async () => {
    await expect(
      offeredPages([modulesEn, modulesNl, modulesGroup]),
    ).resolves.toEqual([MODULES_EN_ID]);
  });

  it('offers a page that exists in one non-default language once', async () => {
    await expect(
      offeredPages([mockLandingPage({ _id: 'about-nl', language: NL })]),
    ).resolves.toEqual(['about-nl']);
  });

  it('offers a translated page with no default-language document once', async () => {
    await expect(
      offeredPages([
        mockLandingPage({ _id: PRICING_NL_ID, language: NL }),
        mockLandingPage({ _id: PRICING_FR_ID, language: FR }),
        mockTranslationMetadata([
          [PRICING_NL_ID, NL],
          [PRICING_FR_ID, FR],
        ]),
      ]),
    ).resolves.toEqual([PRICING_NL_ID]);
  });

  it('passes over a deleted default-language document still named in the group', async () => {
    await expect(
      offeredPages([
        mockLandingPage({ _id: 'team-nl', language: NL }),
        mockTranslationMetadata([
          ['team-en', EN],
          ['team-nl', NL],
        ]),
      ]),
    ).resolves.toEqual(['team-nl']);
  });

  it('hides the draft of a non-default translation along with its published version', async () => {
    await expect(
      offeredPages([
        modulesEn,
        modulesNl,
        mockLandingPage({ _id: 'drafts.modules-nl', language: NL }),
        modulesGroup,
      ]),
    ).resolves.toEqual([MODULES_EN_ID]);
  });

  it('treats a page without a language as the default language', async () => {
    await expect(
      offeredPages([mockLandingPage({ _id: 'legacy' })]),
    ).resolves.toEqual(['legacy']);
  });

  it('follows the site default language', async () => {
    setDefaultLanguage(NL);

    await expect(
      offeredPages([modulesEn, modulesNl, modulesGroup]),
    ).resolves.toEqual([MODULES_NL_ID]);
  });
});
