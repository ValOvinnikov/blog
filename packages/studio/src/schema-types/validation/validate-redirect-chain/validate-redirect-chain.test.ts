import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  REDIRECT_DUPLICATE_SOURCE_ERROR,
  REDIRECT_INCOMING_CHAIN_ERROR,
  REDIRECT_OUTGOING_CHAIN_ERROR,
  validateRedirectDestination,
  validateRedirectSource,
} from '@blog/studio/schema-types/validation/validate-redirect-chain/validate-redirect-chain';
import {
  MOCK_REDIRECT_SOURCE,
  mockRedirect,
} from '@blog/studio/testing/mock-documents';
import { MOCK_FETCH_ERROR } from '@blog/studio/testing/mock-fetch-error';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import { getDraftId, type SanityDocument } from 'sanity';

faker.seed(6018);

const MOCK_REDIRECT_ID = faker.string.uuid();
const MOCK_OTHER_REDIRECT_ID = faker.string.uuid();
const MOCK_SOURCE_PATH = `/${faker.lorem.slug(2)}`;
const MOCK_DESTINATION_PATH = `/${faker.lorem.slug(2)}`;
const MOCK_OTHER_PATH = `/${faker.lorem.slug(2)}`;
const MOCK_PREFIX_PATH = `/${faker.lorem.slug(2)}`;
const MOCK_NESTED_PATH = `${MOCK_PREFIX_PATH}/${faker.lorem.slug(2)}`;

const draftRedirect = mockRedirect({
  _id: getDraftId(MOCK_REDIRECT_ID),
  source: MOCK_SOURCE_PATH,
  destination: MOCK_DESTINATION_PATH,
});

const mockOtherRedirect = (fields: Record<string, unknown>) =>
  mockRedirect({ _id: MOCK_OTHER_REDIRECT_ID, ...fields });

const contextWith = (
  dataset: unknown[],
  document: SanityDocument = draftRedirect,
) => mockGroqValidationContext(dataset, { document });

describe(validateRedirectSource, () => {
  it('passes a source no other redirect uses', async () => {
    await expect(
      validateRedirectSource(MOCK_SOURCE_PATH, contextWith([draftRedirect])),
    ).resolves.toBe(true);
  });

  it('rejects a source another redirect already starts from', async () => {
    const duplicate = mockOtherRedirect({
      source: MOCK_SOURCE_PATH,
      destination: MOCK_OTHER_PATH,
    });

    await expect(
      validateRedirectSource(MOCK_SOURCE_PATH, contextWith([duplicate])),
    ).resolves.toBe(REDIRECT_DUPLICATE_SOURCE_ERROR);
  });

  it('rejects a source another redirect sends visitors to', async () => {
    const incoming = mockOtherRedirect({
      source: MOCK_OTHER_PATH,
      destination: MOCK_SOURCE_PATH,
    });

    await expect(
      validateRedirectSource(MOCK_SOURCE_PATH, contextWith([incoming])),
    ).resolves.toBe(REDIRECT_INCOMING_CHAIN_ERROR);
  });

  it('rejects a prefix source another redirect sends visitors beneath', async () => {
    const prefixDraft = mockRedirect({
      _id: getDraftId(MOCK_REDIRECT_ID),
      source: MOCK_PREFIX_PATH,
      destination: MOCK_OTHER_PATH,
      isPrefix: true,
    });
    const incoming = mockOtherRedirect({
      source: MOCK_REDIRECT_SOURCE,
      destination: MOCK_NESTED_PATH,
    });

    await expect(
      validateRedirectSource(
        MOCK_PREFIX_PATH,
        contextWith([incoming], prefixDraft),
      ),
    ).resolves.toBe(REDIRECT_INCOMING_CHAIN_ERROR);
  });

  it('ignores redirects in another language', async () => {
    const dutchDuplicate = mockOtherRedirect({
      source: MOCK_SOURCE_PATH,
      destination: MOCK_OTHER_PATH,
      language: LOCALE_ISO_CODES.NL,
    });

    await expect(
      validateRedirectSource(MOCK_SOURCE_PATH, contextWith([dutchDuplicate])),
    ).resolves.toBe(true);
  });

  it('passes when the lookup fails', async () => {
    const failingContext = mockGroqValidationContext([], {
      document: draftRedirect,
      fetchError: MOCK_FETCH_ERROR,
    });

    await expect(
      validateRedirectSource(MOCK_SOURCE_PATH, failingContext),
    ).resolves.toBe(true);
  });
});

describe(validateRedirectDestination, () => {
  it('passes a destination that is not redirected', async () => {
    await expect(
      validateRedirectDestination(MOCK_DESTINATION_PATH, contextWith([])),
    ).resolves.toBe(true);
  });

  it('rejects a destination that is itself redirected', async () => {
    const outgoing = mockOtherRedirect({
      source: MOCK_DESTINATION_PATH,
      destination: MOCK_OTHER_PATH,
    });

    await expect(
      validateRedirectDestination(
        MOCK_DESTINATION_PATH,
        contextWith([outgoing]),
      ),
    ).resolves.toBe(REDIRECT_OUTGOING_CHAIN_ERROR);
  });

  it('rejects a destination beneath a prefix redirect', async () => {
    const nestedDraft = mockRedirect({
      _id: getDraftId(MOCK_REDIRECT_ID),
      source: MOCK_SOURCE_PATH,
      destination: MOCK_NESTED_PATH,
    });
    const prefixRedirect = mockOtherRedirect({
      source: MOCK_PREFIX_PATH,
      destination: MOCK_OTHER_PATH,
      isPrefix: true,
    });

    await expect(
      validateRedirectDestination(
        MOCK_NESTED_PATH,
        contextWith([prefixRedirect], nestedDraft),
      ),
    ).resolves.toBe(REDIRECT_OUTGOING_CHAIN_ERROR);
  });
});
