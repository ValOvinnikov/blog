import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { validateLandingSlugUniqueAmongSiblings } from '@blog/studio/schema-types/validation/validate-landing-slug-unique-among-siblings/validate-landing-slug-unique-among-siblings';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import type { SlugValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const OTHER_DRAFT_ID = 'drafts.other';

describe(validateLandingSlugUniqueAmongSiblings, () => {
  const modules = mockLandingPage({
    _id: 'modules',
    slug: 'modules',
    language: EN,
  });
  const help = mockLandingPage({ _id: 'help', slug: 'help', language: EN });
  const modulesFaq = mockLandingPage({
    _id: 'modules-faq',
    slug: 'faq',
    parent: 'modules',
    language: EN,
  });

  it('allows the same slug under a different parent', async () => {
    const helpFaq = mockLandingPage({
      _id: 'drafts.help-faq',
      slug: 'faq',
      parent: 'help',
      language: EN,
    });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        mockGroqValidationContext<SlugValidationContext>(
          [modules, help, modulesFaq],
          { document: helpFaq },
        ),
      ),
    ).resolves.toBe(true);
  });

  it('rejects a slug a sibling uses under the same parent', async () => {
    const other = mockLandingPage({
      _id: OTHER_DRAFT_ID,
      slug: 'faq',
      parent: 'modules',
      language: EN,
    });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        mockGroqValidationContext<SlugValidationContext>(
          [modules, modulesFaq],
          { document: other },
        ),
      ),
    ).resolves.toBe(false);
  });

  it('rejects a slug another top-level page uses', async () => {
    const other = mockLandingPage({
      _id: OTHER_DRAFT_ID,
      slug: 'modules',
      language: EN,
    });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'modules',
        mockGroqValidationContext<SlugValidationContext>([modules], {
          document: other,
        }),
      ),
    ).resolves.toBe(false);
  });

  it('allows a top-level slug that a nested page uses', async () => {
    const topLevelFaq = mockLandingPage({
      _id: 'drafts.faq',
      slug: 'faq',
      language: EN,
    });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        mockGroqValidationContext<SlugValidationContext>(
          [modules, modulesFaq],
          { document: topLevelFaq },
        ),
      ),
    ).resolves.toBe(true);
  });

  it('allows the same slug under the same parent in another language', async () => {
    const dutch = mockLandingPage({
      _id: 'drafts.faq-nl',
      slug: 'faq',
      parent: 'modules',
      language: NL,
    });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        mockGroqValidationContext<SlugValidationContext>(
          [modules, modulesFaq],
          { document: dutch },
        ),
      ),
    ).resolves.toBe(true);
  });

  it('does not count the draft of the same page as a clash', async () => {
    const draft = mockLandingPage({
      _id: 'drafts.modules-faq',
      slug: 'faq',
      parent: 'modules',
      language: EN,
    });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        mockGroqValidationContext<SlugValidationContext>(
          [modules, modulesFaq],
          { document: draft },
        ),
      ),
    ).resolves.toBe(true);
  });

  it('passes when there is no document', async () => {
    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        mockGroqValidationContext<SlugValidationContext>([modulesFaq], {
          document: undefined,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    const other = mockLandingPage({
      _id: 'other',
      slug: 'faq',
      parent: 'modules',
      language: EN,
    });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        mockGroqValidationContext<SlugValidationContext>([modulesFaq], {
          document: other,
          fetchError: new Error('network down'),
        }),
      ),
    ).resolves.toBe(true);
  });
});
