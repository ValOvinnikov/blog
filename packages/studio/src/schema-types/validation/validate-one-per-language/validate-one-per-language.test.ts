import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import { validateOnePerLanguage } from '@blog/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
import { mockHomePage } from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';

const { EN, NL } = LOCALE_ISO_CODES;

const DUTCH_HOME_DRAFT_ID = 'drafts.home-nl';

const DUPLICATE_DUTCH = "There's already a Home Page in Dutch.";
const DUPLICATE_ENGLISH = "There's already a Home Page in English.";

describe(validateOnePerLanguage, () => {
  const englishHome = mockHomePage({ _id: 'page_home', language: EN });

  afterEach(() => {
    setDefaultLanguage(EN);
  });

  it('allows a Home in another language', async () => {
    await expect(
      validateOnePerLanguage(
        mockHomePage({ _id: DUTCH_HOME_DRAFT_ID, language: NL }),
        mockGroqValidationContext([englishHome], {
          type: { title: 'Home Page' },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects a second Home in the same language', async () => {
    await expect(
      validateOnePerLanguage(
        mockHomePage({ _id: DUTCH_HOME_DRAFT_ID, language: NL }),
        mockGroqValidationContext(
          [englishHome, mockHomePage({ _id: 'home-nl-first', language: NL })],
          { type: { title: 'Home Page' } },
        ),
      ),
    ).resolves.toBe(DUPLICATE_DUTCH);
  });

  it('does not count the draft of the same Home as a second one', async () => {
    await expect(
      validateOnePerLanguage(
        mockHomePage({ _id: 'drafts.page_home', language: EN }),
        mockGroqValidationContext([englishHome], {
          type: { title: 'Home Page' },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('counts a Home without a language as the default language', async () => {
    await expect(
      validateOnePerLanguage(
        mockHomePage({ _id: 'drafts.home-en', language: EN }),
        mockGroqValidationContext([mockHomePage({ _id: 'page_home' })], {
          type: { title: 'Home Page' },
        }),
      ),
    ).resolves.toBe(DUPLICATE_ENGLISH);
  });

  it('follows the default language when it is not English', async () => {
    setDefaultLanguage(NL);

    await expect(
      validateOnePerLanguage(
        mockHomePage({ _id: DUTCH_HOME_DRAFT_ID, language: NL }),
        mockGroqValidationContext([mockHomePage({ _id: 'page_home' })], {
          type: { title: 'Home Page' },
        }),
      ),
    ).resolves.toBe(DUPLICATE_DUTCH);
  });

  it('passes when there is no document', async () => {
    await expect(
      validateOnePerLanguage(
        undefined,
        mockGroqValidationContext([englishHome], {
          type: { title: 'Home Page' },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validateOnePerLanguage(
        mockHomePage({ _id: 'home-en', language: EN }),
        mockGroqValidationContext([englishHome], {
          type: { title: 'Home Page' },
          fetchError: new Error('network down'),
        }),
      ),
    ).resolves.toBe(true);
  });
});
