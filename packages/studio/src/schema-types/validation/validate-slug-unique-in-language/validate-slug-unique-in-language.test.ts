import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { validateSlugUniqueInLanguage } from '@blog/studio/schema-types/validation/validate-slug-unique-in-language/validate-slug-unique-in-language';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { MOCK_FETCH_ERROR } from '@blog/studio/testing/mock-fetch-error';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import {
  getDraftId,
  type SanityDocument,
  type SlugValidationContext,
} from 'sanity';

faker.seed(6024);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_ENGLISH_PAGE_ID = faker.string.uuid();
const MOCK_DRAFT_ID = getDraftId(faker.string.uuid());
const MOCK_UNLOCALIZED_PAGE_ID = faker.string.uuid();
const MOCK_SLUG = faker.lorem.slug(2);

const englishPage = mockLandingPage({
  _id: MOCK_ENGLISH_PAGE_ID,
  language: EN,
  slug: MOCK_SLUG,
});

const englishDraft = mockLandingPage({
  _id: MOCK_DRAFT_ID,
  language: EN,
  slug: MOCK_SLUG,
});

const validate = (
  dataset: unknown[],
  document: TMaybeUndefined<SanityDocument>,
  fetchError?: Error,
) =>
  validateSlugUniqueInLanguage(
    MOCK_SLUG,
    mockGroqValidationContext<SlugValidationContext>(dataset, {
      document,
      fetchError,
    }),
  );

describe(validateSlugUniqueInLanguage, () => {
  it('allows the same slug in another language', async () => {
    const dutchDraft = mockLandingPage({
      _id: MOCK_DRAFT_ID,
      language: NL,
      slug: MOCK_SLUG,
    });

    await expect(validate([englishPage], dutchDraft)).resolves.toBe(true);
  });

  it('rejects a slug another page uses in the same language', async () => {
    await expect(validate([englishPage], englishDraft)).resolves.toBe(false);
  });

  it('does not count the draft of the same page as a clash', async () => {
    const ownDraft = mockLandingPage({
      _id: getDraftId(MOCK_ENGLISH_PAGE_ID),
      language: EN,
      slug: MOCK_SLUG,
    });

    await expect(validate([englishPage], ownDraft)).resolves.toBe(true);
  });

  it('treats pages without a language as one language', async () => {
    const unlocalizedPage = mockLandingPage({
      _id: MOCK_UNLOCALIZED_PAGE_ID,
      slug: MOCK_SLUG,
    });
    const unlocalizedDraft = mockLandingPage({
      _id: MOCK_DRAFT_ID,
      slug: MOCK_SLUG,
    });

    await expect(validate([unlocalizedPage], unlocalizedDraft)).resolves.toBe(
      false,
    );
  });

  it('passes when there is no document', async () => {
    await expect(validate([englishPage], undefined)).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validate([englishPage], englishDraft, MOCK_FETCH_ERROR),
    ).resolves.toBe(true);
  });
});
