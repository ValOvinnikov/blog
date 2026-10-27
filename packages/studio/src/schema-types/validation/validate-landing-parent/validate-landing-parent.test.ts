import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  LANDING_PARENT_CYCLE_ERROR,
  LANDING_PARENT_DEPTH_ERROR,
  LANDING_PARENT_LANGUAGE_ERROR,
  validateLandingParent,
} from '@blog/studio/schema-types/validation/validate-landing-parent/validate-landing-parent';
import {
  mockLandingPage,
  mockReference,
} from '@blog/studio/testing/mock-documents';
import { MOCK_FETCH_ERROR } from '@blog/studio/testing/mock-fetch-error';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import { getDraftId } from 'sanity';

faker.seed(6020);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_TOP_ID = faker.string.uuid();
const MOCK_CHILD_ID = faker.string.uuid();
const MOCK_GRANDCHILD_ID = faker.string.uuid();
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_MISSING_ID = faker.string.uuid();
const MOCK_SUB_PAGE_ID = faker.string.uuid();

const topPage = mockLandingPage({ _id: MOCK_TOP_ID, language: EN });
const childPage = mockLandingPage({
  _id: MOCK_CHILD_ID,
  parent: MOCK_TOP_ID,
  language: EN,
});
const draftPage = mockLandingPage({
  _id: getDraftId(MOCK_PAGE_ID),
  language: EN,
});
const draftTopPage = mockLandingPage({
  _id: getDraftId(MOCK_TOP_ID),
  language: EN,
});

describe(validateLandingParent, () => {
  it('passes a page with no parent', async () => {
    await expect(
      validateLandingParent(
        undefined,
        mockGroqValidationContext([topPage], { document: draftPage }),
      ),
    ).resolves.toBe(true);
  });

  it('passes a parent in the same language within the depth bound', async () => {
    await expect(
      validateLandingParent(
        mockReference(MOCK_TOP_ID),
        mockGroqValidationContext([topPage], { document: draftPage }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects the page as its own parent', async () => {
    await expect(
      validateLandingParent(
        mockReference(MOCK_TOP_ID),
        mockGroqValidationContext([topPage], { document: draftTopPage }),
      ),
    ).resolves.toBe(LANDING_PARENT_CYCLE_ERROR);
  });

  it('rejects a parent that sits beneath the page', async () => {
    await expect(
      validateLandingParent(
        mockReference(MOCK_CHILD_ID),
        mockGroqValidationContext([topPage, childPage], {
          document: draftTopPage,
        }),
      ),
    ).resolves.toBe(LANDING_PARENT_CYCLE_ERROR);
  });

  it('rejects a parent in another language', async () => {
    const dutchDraft = mockLandingPage({
      _id: getDraftId(MOCK_PAGE_ID),
      language: NL,
    });

    await expect(
      validateLandingParent(
        mockReference(MOCK_TOP_ID),
        mockGroqValidationContext([topPage], { document: dutchDraft }),
      ),
    ).resolves.toBe(LANDING_PARENT_LANGUAGE_ERROR);
  });

  it('rejects nesting the page deeper than the bound', async () => {
    const grandchildPage = mockLandingPage({
      _id: MOCK_GRANDCHILD_ID,
      parent: MOCK_CHILD_ID,
      language: EN,
    });

    await expect(
      validateLandingParent(
        mockReference(MOCK_GRANDCHILD_ID),
        mockGroqValidationContext([topPage, childPage, grandchildPage], {
          document: draftPage,
        }),
      ),
    ).resolves.toBe(LANDING_PARENT_DEPTH_ERROR);
  });

  it('rejects a move that pushes the page’s own sub-pages past the bound', async () => {
    const subPage = mockLandingPage({
      _id: MOCK_SUB_PAGE_ID,
      parent: MOCK_PAGE_ID,
      language: EN,
    });

    await expect(
      validateLandingParent(
        mockReference(MOCK_CHILD_ID),
        mockGroqValidationContext([topPage, childPage, subPage], {
          document: draftPage,
        }),
      ),
    ).resolves.toBe(LANDING_PARENT_DEPTH_ERROR);
  });

  it('passes when the parent no longer exists', async () => {
    await expect(
      validateLandingParent(
        mockReference(MOCK_MISSING_ID),
        mockGroqValidationContext([], { document: draftPage }),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validateLandingParent(
        mockReference(MOCK_TOP_ID),
        mockGroqValidationContext([topPage], {
          document: draftPage,
          fetchError: MOCK_FETCH_ERROR,
        }),
      ),
    ).resolves.toBe(true);
  });
});
