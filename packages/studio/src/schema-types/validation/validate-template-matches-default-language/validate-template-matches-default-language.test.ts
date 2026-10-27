import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { validateTemplateMatchesDefaultLanguage } from '@blog/studio/schema-types/validation/validate-template-matches-default-language/validate-template-matches-default-language';
import {
  mockLandingPage,
  mockReference,
  mockTranslationMetadata,
} from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import { getDraftId, type SanityDocument } from 'sanity';

faker.seed(6034);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_ENGLISH_ID = faker.string.uuid();
const MOCK_DUTCH_ID = faker.string.uuid();
const MOCK_TEMPLATE_ID = faker.string.uuid();
const MOCK_OTHER_TEMPLATE_ID = faker.string.uuid();

const MISMATCH_WARNING = `This page uses a different template from its ${LOCALE_LABEL[EN]} page.`;

const mockDutchPage = (_id: string, templateId: string) =>
  mockLandingPage({ _id, language: NL, template: mockReference(templateId) });

describe(validateTemplateMatchesDefaultLanguage, () => {
  let englishPage: SanityDocument;
  let linked: ReturnType<typeof mockTranslationMetadata>;

  beforeEach(() => {
    englishPage = mockLandingPage({
      _id: MOCK_ENGLISH_ID,
      language: EN,
      template: mockReference(MOCK_TEMPLATE_ID),
    });
    linked = mockTranslationMetadata([
      [MOCK_ENGLISH_ID, EN],
      [MOCK_DUTCH_ID, NL],
    ]);
  });

  it.each([
    [
      'passes a translation using the same template as its default-language page',
      MOCK_TEMPLATE_ID,
      true,
    ],
    [
      'warns about a translation using another template than its default page',
      MOCK_OTHER_TEMPLATE_ID,
      MISMATCH_WARNING,
    ],
  ])('%s', async (_description, templateId, expected) => {
    const dutchDraft = mockDutchPage(getDraftId(MOCK_DUTCH_ID), templateId);
    const context = mockGroqValidationContext(
      [englishPage, dutchDraft, linked],
      { document: dutchDraft },
    );

    await expect(
      validateTemplateMatchesDefaultLanguage(
        mockReference(templateId),
        context,
      ),
    ).resolves.toBe(expected);
  });

  it('passes the default-language page itself', async () => {
    const context = mockGroqValidationContext([englishPage, linked], {
      document: englishPage,
    });

    await expect(
      validateTemplateMatchesDefaultLanguage(
        mockReference(MOCK_TEMPLATE_ID),
        context,
      ),
    ).resolves.toBe(true);
  });

  it('passes a page that is not linked to any translation', async () => {
    const unlinkedDutchPage = mockDutchPage(
      MOCK_DUTCH_ID,
      MOCK_OTHER_TEMPLATE_ID,
    );
    const context = mockGroqValidationContext(
      [englishPage, unlinkedDutchPage],
      { document: unlinkedDutchPage },
    );

    await expect(
      validateTemplateMatchesDefaultLanguage(
        mockReference(MOCK_OTHER_TEMPLATE_ID),
        context,
      ),
    ).resolves.toBe(true);
  });
});
