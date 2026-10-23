import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { validateSlugUniqueInLanguage } from '@blog/studio/schema-types/validation/validate-slug-unique-in-language/validate-slug-unique-in-language';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import type { SlugValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const OTHER_DRAFT_ID = 'drafts.other';

describe(validateSlugUniqueInLanguage, () => {
  const englishAbout = mockLandingPage({
    _id: 'about-en',
    language: EN,
    slug: 'about',
  });

  it('allows the same slug in another language', async () => {
    const dutch = mockLandingPage({
      _id: 'drafts.about-nl',
      language: NL,
      slug: 'about',
    });

    await expect(
      validateSlugUniqueInLanguage(
        'about',
        mockGroqValidationContext<SlugValidationContext>([englishAbout], {
          document: dutch,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects a slug another page uses in the same language', async () => {
    const other = mockLandingPage({
      _id: OTHER_DRAFT_ID,
      language: EN,
      slug: 'about',
    });

    await expect(
      validateSlugUniqueInLanguage(
        'about',
        mockGroqValidationContext<SlugValidationContext>([englishAbout], {
          document: other,
        }),
      ),
    ).resolves.toBe(false);
  });

  it('does not count the draft of the same page as a clash', async () => {
    const draft = mockLandingPage({
      _id: 'drafts.about-en',
      language: EN,
      slug: 'about',
    });

    await expect(
      validateSlugUniqueInLanguage(
        'about',
        mockGroqValidationContext<SlugValidationContext>([englishAbout], {
          document: draft,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('treats pages without a language as one language', async () => {
    const legacy = mockLandingPage({ _id: 'legacy', slug: 'contact' });
    const other = mockLandingPage({ _id: OTHER_DRAFT_ID, slug: 'contact' });

    await expect(
      validateSlugUniqueInLanguage(
        'contact',
        mockGroqValidationContext<SlugValidationContext>([legacy], {
          document: other,
        }),
      ),
    ).resolves.toBe(false);
  });

  it('passes when there is no document', async () => {
    await expect(
      validateSlugUniqueInLanguage(
        'about',
        mockGroqValidationContext<SlugValidationContext>([englishAbout], {
          document: undefined,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    const other = mockLandingPage({
      _id: 'other',
      language: EN,
      slug: 'about',
    });

    await expect(
      validateSlugUniqueInLanguage(
        'about',
        mockGroqValidationContext<SlugValidationContext>([englishAbout], {
          document: other,
          fetchError: new Error('network down'),
        }),
      ),
    ).resolves.toBe(true);
  });
});
