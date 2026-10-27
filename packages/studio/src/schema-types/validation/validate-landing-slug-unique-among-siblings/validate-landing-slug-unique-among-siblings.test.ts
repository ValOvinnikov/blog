import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { validateLandingSlugUniqueAmongSiblings } from '@blog/studio/schema-types/validation/validate-landing-slug-unique-among-siblings/validate-landing-slug-unique-among-siblings';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { MOCK_FETCH_ERROR } from '@blog/studio/testing/mock-fetch-error';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import {
  getDraftId,
  type SanityDocument,
  type SlugValidationContext,
} from 'sanity';

faker.seed(6019);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_MODULES_ID = faker.string.uuid();
const MOCK_HELP_ID = faker.string.uuid();
const MOCK_MODULES_FAQ_ID = faker.string.uuid();
const MOCK_DRAFT_ID = getDraftId(faker.string.uuid());
const MOCK_MODULES_SLUG = faker.lorem.slug(2);
const MOCK_FAQ_SLUG = faker.lorem.slug(2);

const modulesPage = mockLandingPage({
  _id: MOCK_MODULES_ID,
  slug: MOCK_MODULES_SLUG,
  language: EN,
});
const helpPage = mockLandingPage({
  _id: MOCK_HELP_ID,
  slug: faker.lorem.slug(2),
  language: EN,
});
const modulesFaqPage = mockLandingPage({
  _id: MOCK_MODULES_FAQ_ID,
  slug: MOCK_FAQ_SLUG,
  parent: MOCK_MODULES_ID,
  language: EN,
});

const mockDraftLandingPage = (fields: Record<string, unknown>) =>
  mockLandingPage({
    _id: MOCK_DRAFT_ID,
    language: EN,
    ...fields,
  });

const validate = (
  slug: string,
  dataset: unknown[],
  document: TMaybeUndefined<SanityDocument>,
  fetchError?: Error,
) =>
  validateLandingSlugUniqueAmongSiblings(
    slug,
    mockGroqValidationContext<SlugValidationContext>(dataset, {
      document,
      fetchError,
    }),
  );

describe(validateLandingSlugUniqueAmongSiblings, () => {
  it('allows the same slug under a different parent', async () => {
    const helpFaq = mockDraftLandingPage({
      slug: MOCK_FAQ_SLUG,
      parent: MOCK_HELP_ID,
    });

    await expect(
      validate(MOCK_FAQ_SLUG, [modulesPage, helpPage, modulesFaqPage], helpFaq),
    ).resolves.toBe(true);
  });

  it('rejects a slug a sibling uses under the same parent', async () => {
    const sibling = mockDraftLandingPage({
      slug: MOCK_FAQ_SLUG,
      parent: MOCK_MODULES_ID,
    });

    await expect(
      validate(MOCK_FAQ_SLUG, [modulesPage, modulesFaqPage], sibling),
    ).resolves.toBe(false);
  });

  it('rejects a slug another top-level page uses', async () => {
    const topLevel = mockDraftLandingPage({ slug: MOCK_MODULES_SLUG });

    await expect(
      validate(MOCK_MODULES_SLUG, [modulesPage], topLevel),
    ).resolves.toBe(false);
  });

  it('allows a top-level slug that a nested page uses', async () => {
    const topLevelFaq = mockDraftLandingPage({ slug: MOCK_FAQ_SLUG });

    await expect(
      validate(MOCK_FAQ_SLUG, [modulesPage, modulesFaqPage], topLevelFaq),
    ).resolves.toBe(true);
  });

  it('allows the same slug under the same parent in another language', async () => {
    const dutchSibling = mockDraftLandingPage({
      slug: MOCK_FAQ_SLUG,
      parent: MOCK_MODULES_ID,
      language: NL,
    });

    await expect(
      validate(MOCK_FAQ_SLUG, [modulesPage, modulesFaqPage], dutchSibling),
    ).resolves.toBe(true);
  });

  it('does not count the draft of the same page as a clash', async () => {
    const ownDraft = mockDraftLandingPage({
      _id: getDraftId(MOCK_MODULES_FAQ_ID),
      slug: MOCK_FAQ_SLUG,
      parent: MOCK_MODULES_ID,
    });

    await expect(
      validate(MOCK_FAQ_SLUG, [modulesPage, modulesFaqPage], ownDraft),
    ).resolves.toBe(true);
  });

  it('passes when there is no document', async () => {
    await expect(
      validate(MOCK_FAQ_SLUG, [modulesFaqPage], undefined),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    const sibling = mockDraftLandingPage({
      slug: MOCK_FAQ_SLUG,
      parent: MOCK_MODULES_ID,
    });

    await expect(
      validate(MOCK_FAQ_SLUG, [modulesFaqPage], sibling, MOCK_FETCH_ERROR),
    ).resolves.toBe(true);
  });
});
