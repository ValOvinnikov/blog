import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import { validateOnePerLanguage } from '@blog/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
import { mockHomePage } from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import {
  getDraftId,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

faker.seed(6032);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_TYPE_TITLE = faker.lorem.words(2);
const MOCK_ENGLISH_HOME_ID = faker.string.uuid();

const duplicateError = (language: TLocaleIsoCode) =>
  `There's already a ${MOCK_TYPE_TITLE} in ${LOCALE_LABEL[language]}.`;

const contextWith = (dataset: SanityDocument[], fetchError?: Error) =>
  mockGroqValidationContext(dataset, {
    type: { title: MOCK_TYPE_TITLE },
    fetchError,
  });

const mockHomeDraft = (language: TLocaleIsoCode) =>
  mockHomePage({ _id: getDraftId(faker.string.uuid()), language });

describe(validateOnePerLanguage, () => {
  let englishHome: SanityDocument;
  let untranslatedHome: SanityDocument;
  let context: ValidationContext;

  beforeEach(() => {
    englishHome = mockHomePage({ _id: MOCK_ENGLISH_HOME_ID, language: EN });
    untranslatedHome = mockHomePage({ _id: faker.string.uuid() });
    context = contextWith([englishHome]);
  });

  afterEach(() => {
    setDefaultLanguage(EN);
  });

  it('allows a Home in another language', async () => {
    await expect(
      validateOnePerLanguage(mockHomeDraft(NL), context),
    ).resolves.toBe(true);
  });

  it('rejects a second Home in the same language', async () => {
    const dutchHome = mockHomePage({ _id: faker.string.uuid(), language: NL });

    await expect(
      validateOnePerLanguage(
        mockHomeDraft(NL),
        contextWith([englishHome, dutchHome]),
      ),
    ).resolves.toBe(duplicateError(NL));
  });

  it('does not count the draft of the same Home as a second one', async () => {
    const englishHomeDraft = mockHomePage({
      _id: getDraftId(MOCK_ENGLISH_HOME_ID),
      language: EN,
    });

    await expect(
      validateOnePerLanguage(englishHomeDraft, context),
    ).resolves.toBe(true);
  });

  it('counts a Home without a language as the default language', async () => {
    await expect(
      validateOnePerLanguage(
        mockHomeDraft(EN),
        contextWith([untranslatedHome]),
      ),
    ).resolves.toBe(duplicateError(EN));
  });

  it('follows the default language when it is not English', async () => {
    setDefaultLanguage(NL);

    await expect(
      validateOnePerLanguage(
        mockHomeDraft(NL),
        contextWith([untranslatedHome]),
      ),
    ).resolves.toBe(duplicateError(NL));
  });

  it('passes when there is no document', async () => {
    await expect(validateOnePerLanguage(undefined, context)).resolves.toBe(
      true,
    );
  });

  it('passes when the fetch fails', async () => {
    const failingContext = contextWith(
      [englishHome],
      new Error(faker.lorem.sentence()),
    );

    await expect(
      validateOnePerLanguage(mockHomeDraft(EN), failingContext),
    ).resolves.toBe(true);
  });
});
