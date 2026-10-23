import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import { validateOnePerLanguage } from '@blog/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
import { mockHomePage } from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import type { SanityDocument, ValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const DUTCH_HOME_DRAFT_ID = 'drafts.home-nl';

const DUPLICATE_DUTCH = "There's already a Home Page in Dutch.";
const DUPLICATE_ENGLISH = "There's already a Home Page in English.";

const HOME_PAGE_TYPE = { title: 'Home Page' };

const contextWith = (dataset: SanityDocument[], fetchError?: Error) =>
  mockGroqValidationContext(dataset, { type: HOME_PAGE_TYPE, fetchError });

describe(validateOnePerLanguage, () => {
  let englishHome: SanityDocument;
  let untranslatedHome: SanityDocument;
  let dutchHomeDraft: SanityDocument;
  let context: ValidationContext;

  beforeEach(() => {
    englishHome = mockHomePage({ _id: 'page_home', language: EN });
    untranslatedHome = mockHomePage({ _id: 'page_home' });
    dutchHomeDraft = mockHomePage({ _id: DUTCH_HOME_DRAFT_ID, language: NL });
    context = contextWith([englishHome]);
  });

  afterEach(() => {
    setDefaultLanguage(EN);
  });

  it('allows a Home in another language', async () => {
    await expect(validateOnePerLanguage(dutchHomeDraft, context)).resolves.toBe(
      true,
    );
  });

  it('rejects a second Home in the same language', async () => {
    await expect(
      validateOnePerLanguage(
        dutchHomeDraft,
        contextWith([
          englishHome,
          mockHomePage({ _id: 'home-nl-first', language: NL }),
        ]),
      ),
    ).resolves.toBe(DUPLICATE_DUTCH);
  });

  it('does not count the draft of the same Home as a second one', async () => {
    await expect(
      validateOnePerLanguage(
        mockHomePage({ _id: 'drafts.page_home', language: EN }),
        context,
      ),
    ).resolves.toBe(true);
  });

  it('counts a Home without a language as the default language', async () => {
    await expect(
      validateOnePerLanguage(
        mockHomePage({ _id: 'drafts.home-en', language: EN }),
        contextWith([untranslatedHome]),
      ),
    ).resolves.toBe(DUPLICATE_ENGLISH);
  });

  it('follows the default language when it is not English', async () => {
    setDefaultLanguage(NL);

    await expect(
      validateOnePerLanguage(dutchHomeDraft, contextWith([untranslatedHome])),
    ).resolves.toBe(DUPLICATE_DUTCH);
  });

  it('passes when there is no document', async () => {
    await expect(validateOnePerLanguage(undefined, context)).resolves.toBe(
      true,
    );
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validateOnePerLanguage(
        mockHomePage({ _id: 'home-en', language: EN }),
        contextWith([englishHome], new Error('network down')),
      ),
    ).resolves.toBe(true);
  });
});
