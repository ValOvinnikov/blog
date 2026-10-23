import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { validateSettingMatchesDefaultLanguage } from '@blog/studio/schema-types/validation/validate-setting-matches-default-language/validate-setting-matches-default-language';
import {
  mockLandingPage,
  mockTranslationMetadata,
} from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import type { SanityDocument } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const DUTCH_DRAFT_ID = 'drafts.about-nl';

const MISMATCH = '"Show sidebar" is set differently from its English page.';

const validate = validateSettingMatchesDefaultLanguage({
  field: 'showSidebar',
  title: 'Show sidebar',
  initialValue: true,
});

describe(validateSettingMatchesDefaultLanguage, () => {
  const linked = mockTranslationMetadata([
    ['about-en', EN],
    ['about-nl', NL],
  ]);
  let dutchPage: SanityDocument;

  beforeEach(() => {
    dutchPage = mockLandingPage({
      _id: DUTCH_DRAFT_ID,
      language: NL,
      showSidebar: false,
    });
  });

  it('passes a translation with the same value as its default-language page', async () => {
    await expect(
      validate(
        false,
        mockGroqValidationContext(
          [
            mockLandingPage({
              _id: 'about-en',
              language: EN,
              showSidebar: false,
            }),
            dutchPage,
            linked,
          ],
          { document: dutchPage },
        ),
      ),
    ).resolves.toBe(true);
  });

  it('warns about a translation with a different value from its default-language page', async () => {
    await expect(
      validate(
        false,
        mockGroqValidationContext(
          [
            mockLandingPage({
              _id: 'about-en',
              language: EN,
              showSidebar: true,
            }),
            dutchPage,
            linked,
          ],
          { document: dutchPage },
        ),
      ),
    ).resolves.toBe(MISMATCH);
  });

  it('treats an unset value as the initial value on either page', async () => {
    const unsetDutchPage = mockLandingPage({
      _id: DUTCH_DRAFT_ID,
      language: NL,
    });

    await expect(
      validate(
        undefined,
        mockGroqValidationContext(
          [
            mockLandingPage({
              _id: 'about-en',
              language: EN,
              showSidebar: true,
            }),
            unsetDutchPage,
            linked,
          ],
          { document: unsetDutchPage },
        ),
      ),
    ).resolves.toBe(true);
  });

  it('warns when an unset default-language value differs from the translation', async () => {
    await expect(
      validate(
        false,
        mockGroqValidationContext(
          [
            mockLandingPage({ _id: 'about-en', language: EN }),
            dutchPage,
            linked,
          ],
          { document: dutchPage },
        ),
      ),
    ).resolves.toBe(MISMATCH);
  });

  it('passes the default-language page itself', async () => {
    const englishPage = mockLandingPage({
      _id: 'about-en',
      language: EN,
      showSidebar: false,
    });

    await expect(
      validate(
        false,
        mockGroqValidationContext([englishPage, linked], {
          document: englishPage,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('passes a page that is not linked to any translation', async () => {
    const unlinkedDutchPage = mockLandingPage({
      _id: 'about-nl',
      language: NL,
      showSidebar: false,
    });

    await expect(
      validate(
        false,
        mockGroqValidationContext(
          [
            mockLandingPage({
              _id: 'about-en',
              language: EN,
              showSidebar: true,
            }),
            unlinkedDutchPage,
          ],
          { document: unlinkedDutchPage },
        ),
      ),
    ).resolves.toBe(true);
  });
});
