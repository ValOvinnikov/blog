import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { validateTemplateMatchesDefaultLanguage } from '@blog/studio/schema-types/validation/validate-template-matches-default-language/validate-template-matches-default-language';
import {
  mockLandingPage,
  mockReference,
  mockTranslationMetadata,
} from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';

const { EN, NL } = LOCALE_ISO_CODES;

const DUTCH_DRAFT_ID = 'drafts.about-nl';
const ABOUT_TEMPLATE_ID = 'template-about';
const OTHER_TEMPLATE_ID = 'template-other';

const MISMATCH = 'This page uses a different template from its English page.';

describe(validateTemplateMatchesDefaultLanguage, () => {
  const englishPage = mockLandingPage({
    _id: 'about-en',
    language: EN,
    template: mockReference(ABOUT_TEMPLATE_ID),
  });
  const linked = mockTranslationMetadata([
    ['about-en', EN],
    ['about-nl', NL],
  ]);

  it('passes a translation using the same template as its default-language page', async () => {
    const dutchPage = mockLandingPage({
      _id: DUTCH_DRAFT_ID,
      language: NL,
      template: mockReference(ABOUT_TEMPLATE_ID),
    });

    await expect(
      validateTemplateMatchesDefaultLanguage(
        mockReference(ABOUT_TEMPLATE_ID),
        mockGroqValidationContext([englishPage, dutchPage, linked], {
          document: dutchPage,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('warns about a translation using a different template from its default-language page', async () => {
    const dutchPage = mockLandingPage({
      _id: DUTCH_DRAFT_ID,
      language: NL,
      template: mockReference(OTHER_TEMPLATE_ID),
    });

    await expect(
      validateTemplateMatchesDefaultLanguage(
        mockReference(OTHER_TEMPLATE_ID),
        mockGroqValidationContext([englishPage, dutchPage, linked], {
          document: dutchPage,
        }),
      ),
    ).resolves.toBe(MISMATCH);
  });

  it('passes the default-language page itself', async () => {
    await expect(
      validateTemplateMatchesDefaultLanguage(
        mockReference(ABOUT_TEMPLATE_ID),
        mockGroqValidationContext([englishPage, linked], {
          document: englishPage,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('passes a page that is not linked to any translation', async () => {
    const dutchPage = mockLandingPage({
      _id: 'about-nl',
      language: NL,
      template: mockReference(OTHER_TEMPLATE_ID),
    });

    await expect(
      validateTemplateMatchesDefaultLanguage(
        mockReference(OTHER_TEMPLATE_ID),
        mockGroqValidationContext([englishPage, dutchPage], {
          document: dutchPage,
        }),
      ),
    ).resolves.toBe(true);
  });
});
