import type { TMaybeUndefined } from '@blog/config';
import { LEGAL_PAGE_KIND, LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LEGAL_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/legal-document/legal-document-type';
import { PAGE_PRIVACY_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/privacy-document/privacy-document-type';
import {
  LEGAL_PAGE_KIND_FIELD,
  validateUniqueLegalPageKind,
} from '@blog/studio/schema-types/validation/validate-unique-legal-page-kind/validate-unique-legal-page-kind';
import { mockDocument } from '@blog/studio/testing/mock-documents';
import { MOCK_FETCH_ERROR } from '@blog/studio/testing/mock-fetch-error';
import {
  mockFetchContext,
  mockGroqValidationContext,
} from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import { getDraftId } from 'sanity';

faker.seed(6506);

const { EN, NL } = LOCALE_ISO_CODES;
const { TERMS, IMPRINT, OTHER } = LEGAL_PAGE_KIND;

const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_OTHER_PAGE_ID = faker.string.uuid();

const mockLegalPage = (fields: Record<string, unknown> = {}) =>
  mockDocument({
    _id: MOCK_OTHER_PAGE_ID,
    _type: PAGE_LEGAL_DOCUMENT_TYPE,
    language: EN,
    [LEGAL_PAGE_KIND_FIELD]: TERMS,
    ...fields,
  });

const ownDraft = mockLegalPage({ _id: getDraftId(MOCK_PAGE_ID) });

const validateAgainst = (dataset: unknown[], kind: TMaybeUndefined<string>) =>
  validateUniqueLegalPageKind(
    kind,
    mockGroqValidationContext(dataset, { document: ownDraft }),
  );

describe(validateUniqueLegalPageKind, () => {
  it('flags another published page of the same kind and language', async () => {
    await expect(validateAgainst([mockLegalPage()], TERMS)).resolves.toEqual(
      expect.any(String),
    );
  });

  it('reads pages through the published perspective', async () => {
    const { context, withConfigCalls } = mockFetchContext(false, ownDraft);

    await validateUniqueLegalPageKind(TERMS, context);

    expect(withConfigCalls).toEqual([{ perspective: 'published' }]);
  });

  it.each([
    ['its own published copy', mockLegalPage({ _id: MOCK_PAGE_ID })],
    [
      'a page of another kind',
      mockLegalPage({ [LEGAL_PAGE_KIND_FIELD]: IMPRINT }),
    ],
    ['a page in another language', mockLegalPage({ language: NL })],
    [
      'a page of another type',
      mockLegalPage({ _type: PAGE_PRIVACY_DOCUMENT_TYPE }),
    ],
  ])('passes beside %s', async (_case, page) => {
    await expect(validateAgainst([page], TERMS)).resolves.toBe(true);
  });

  it('passes a second Other page', async () => {
    await expect(
      validateAgainst(
        [mockLegalPage({ [LEGAL_PAGE_KIND_FIELD]: OTHER })],
        OTHER,
      ),
    ).resolves.toBe(true);
  });

  it('passes when no kind is chosen', async () => {
    await expect(validateAgainst([mockLegalPage()], undefined)).resolves.toBe(
      true,
    );
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validateUniqueLegalPageKind(
        TERMS,
        mockGroqValidationContext([mockLegalPage()], {
          document: ownDraft,
          fetchError: MOCK_FETCH_ERROR,
        }),
      ),
    ).resolves.toBe(true);
  });
});
