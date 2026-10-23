import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_ABOUT_EN_PAGE_ID,
  MOCK_ABOUT_NL_PAGE_ID,
  MOCK_ABOUT_NL_SLUG,
  MOCK_ABOUT_SLUG,
  MOCK_ABOUT_TRANSLATION_METADATA,
  MOCK_PRICING_EN_PAGE_ID,
  MOCK_PRICING_NL_PAGE_ID,
  MOCK_PRICING_NL_SLUG,
  MOCK_PRICING_SLUG,
  MOCK_TEAM_EN_PAGE_ID,
  MOCK_TEAM_NL_PAGE_ID,
  MOCK_TEAM_SLUG,
  mockLandingPageDocument,
  mockTranslationMetadata,
} from '@blog/service/testing/shared/translated-pages-dataset';

import { translationsQuery } from './translations';

const MODULES_EN_PAGE_ID = 'modules-en';
const MODULES_NL_PAGE_ID = 'modules-nl';
const { EN, NL } = LOCALE_ISO_CODES;

const aboutEn = mockLandingPageDocument(
  MOCK_ABOUT_EN_PAGE_ID,
  EN,
  MOCK_ABOUT_SLUG,
);
const aboutNl = mockLandingPageDocument(
  MOCK_ABOUT_NL_PAGE_ID,
  NL,
  MOCK_ABOUT_NL_SLUG,
);
const contact = mockLandingPageDocument('contact', EN, 'contact');
const pricing = mockLandingPageDocument(
  MOCK_PRICING_EN_PAGE_ID,
  EN,
  MOCK_PRICING_SLUG,
);
const draftOnlyPricingNl = mockLandingPageDocument(
  `drafts.${MOCK_PRICING_NL_PAGE_ID}`,
  NL,
  MOCK_PRICING_NL_SLUG,
);
const team = mockLandingPageDocument(MOCK_TEAM_EN_PAGE_ID, EN, MOCK_TEAM_SLUG);
const slugless = mockLandingPageDocument(MOCK_TEAM_NL_PAGE_ID, NL);
const modulesEn = mockLandingPageDocument(MODULES_EN_PAGE_ID, EN, 'modules');
const modulesNl = mockLandingPageDocument(MODULES_NL_PAGE_ID, NL, 'modules');
const faqEn = {
  ...mockLandingPageDocument('faq-en', EN, 'faq'),
  parent: mockReference(MODULES_EN_PAGE_ID),
};
const faqNl = {
  ...mockLandingPageDocument('faq-nl', NL, 'vragen'),
  parent: mockReference(MODULES_NL_PAGE_ID),
};

const dataset = [
  aboutEn,
  aboutNl,
  contact,
  pricing,
  draftOnlyPricingNl,
  team,
  slugless,
  modulesEn,
  modulesNl,
  faqEn,
  faqNl,
  mockTranslationMetadata('meta-faq', [
    [EN, 'faq-en'],
    [NL, 'faq-nl'],
  ]),
  MOCK_ABOUT_TRANSLATION_METADATA,
  mockTranslationMetadata('meta-pricing', [
    [EN, MOCK_PRICING_EN_PAGE_ID],
    [NL, MOCK_PRICING_NL_PAGE_ID],
  ]),
  mockTranslationMetadata('meta-team', [
    [EN, MOCK_TEAM_EN_PAGE_ID],
    [NL, MOCK_TEAM_NL_PAGE_ID],
  ]),
];

function resolve(root: { _id: string }): Promise<unknown> {
  return evaluateGroqExpression(
    `*[_id == $id][0]{ "translations": ${translationsQuery.query} }.translations`,
    dataset,
    undefined,
    { id: root._id },
  );
}

describe('translationsQuery', () => {
  it('lists every translation, the page itself included', async () => {
    expect(await resolve(aboutEn)).toEqual([
      { language: EN, slug: MOCK_ABOUT_SLUG },
      { language: NL, slug: MOCK_ABOUT_NL_SLUG },
    ]);
  });

  it('lists the same set from a translation', async () => {
    expect(await resolve(aboutNl)).toEqual([
      { language: EN, slug: MOCK_ABOUT_SLUG },
      { language: NL, slug: MOCK_ABOUT_NL_SLUG },
    ]);
  });

  it('is null when the page has no translation metadata', async () => {
    expect(await resolve(contact)).toBeNull();
  });

  it('skips a translation that is not published', async () => {
    expect(await resolve(pricing)).toEqual([
      { language: EN, slug: MOCK_PRICING_SLUG },
    ]);
  });

  it('skips a published translation that has no slug', async () => {
    expect(await resolve(team)).toEqual([
      { language: EN, slug: MOCK_TEAM_SLUG },
    ]);
  });

  it('lists a nested page by its full path in each language', async () => {
    expect(await resolve(faqEn)).toEqual([
      { language: EN, slug: 'modules/faq' },
      { language: NL, slug: 'modules/vragen' },
    ]);
  });
});
