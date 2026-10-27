import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { validateSettingMatchesDefaultLanguage } from '@blog/studio/schema-types/validation/validate-setting-matches-default-language/validate-setting-matches-default-language';
import {
  mockLandingPage,
  mockTranslationMetadata,
} from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import { getDraftId } from 'sanity';

faker.seed(6033);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_SETTING_FIELD = 'showSidebar';
const MOCK_SETTING_TITLE = faker.lorem.words(2);
const MOCK_ENGLISH_ID = faker.string.uuid();
const MOCK_DUTCH_ID = faker.string.uuid();

const MISMATCH_WARNING = `"${MOCK_SETTING_TITLE}" is set differently from its ${LOCALE_LABEL[EN]} page.`;

const validate = validateSettingMatchesDefaultLanguage({
  field: MOCK_SETTING_FIELD,
  title: MOCK_SETTING_TITLE,
  initialValue: true,
});

const mockEnglishPage = (setting?: boolean) =>
  mockLandingPage({
    _id: MOCK_ENGLISH_ID,
    language: EN,
    [MOCK_SETTING_FIELD]: setting,
  });

const mockDutchPage = (_id: string, setting?: boolean) =>
  mockLandingPage({ _id, language: NL, [MOCK_SETTING_FIELD]: setting });

describe(validateSettingMatchesDefaultLanguage, () => {
  const linked = mockTranslationMetadata([
    [MOCK_ENGLISH_ID, EN],
    [MOCK_DUTCH_ID, NL],
  ]);

  it.each([
    [
      'passes a translation set the same as its default-language page',
      false,
      false,
      true,
    ],
    [
      'warns about a translation set differently from its default-language page',
      false,
      true,
      MISMATCH_WARNING,
    ],
    ['treats an unset translation as the initial value', undefined, true, true],
    [
      'treats an unset default-language page as the initial value',
      false,
      undefined,
      MISMATCH_WARNING,
    ],
  ])('%s', async (_description, dutchSetting, englishSetting, expected) => {
    const dutchDraft = mockDutchPage(getDraftId(MOCK_DUTCH_ID), dutchSetting);
    const context = mockGroqValidationContext(
      [mockEnglishPage(englishSetting), dutchDraft, linked],
      { document: dutchDraft },
    );

    await expect(validate(dutchSetting, context)).resolves.toBe(expected);
  });

  it('passes the default-language page itself', async () => {
    const englishPage = mockEnglishPage(false);
    const context = mockGroqValidationContext([englishPage, linked], {
      document: englishPage,
    });

    await expect(validate(false, context)).resolves.toBe(true);
  });

  it('passes a page that is not linked to any translation', async () => {
    const unlinkedDutchPage = mockDutchPage(MOCK_DUTCH_ID, false);
    const context = mockGroqValidationContext(
      [mockEnglishPage(true), unlinkedDutchPage],
      { document: unlinkedDutchPage },
    );

    await expect(validate(false, context)).resolves.toBe(true);
  });
});
