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

  it('counts a page without a language as the default language', async () => {
    const unlocalizedDraft = mockLegalPage({
      _id: getDraftId(MOCK_PAGE_ID),
      language: undefined,
    });

    await expect(
      validateUniqueLegalPageKind(
        TERMS,
        mockGroqValidationContext([mockLegalPage()], {
          document: unlocalizedDraft,
        }),
      ),
    ).resolves.toEqual(expect.any(String));
  });

  it('reads pages through the published perspective', async () => {
    const { context, withConfigCalls } = mockFetchContext(false, ownDraft);

    await validateUniqueLegalPageKind(TERMS, context);

    expect(withConfigCalls).toEqual([{ perspective: 'published' }]);
  });

  it.each([
    {
      case: 'beside its own published copy',
      page: mockLegalPage({ _id: MOCK_PAGE_ID }),
      kind: TERMS,
    },
    {
      case: 'beside a page of another kind',
      page: mockLegalPage({ [LEGAL_PAGE_KIND_FIELD]: IMPRINT }),
      kind: TERMS,
    },
    {
      case: 'beside a page in another language',
      page: mockLegalPage({ language: NL }),
      kind: TERMS,
    },
    {
      case: 'beside a page of another type',
      page: mockLegalPage({ _type: PAGE_PRIVACY_DOCUMENT_TYPE }),
      kind: TERMS,
    },
    {
      case: 'a second Other page',
      page: mockLegalPage({ [LEGAL_PAGE_KIND_FIELD]: OTHER }),
      kind: OTHER,
    },
    { case: 'when no kind is chosen', page: mockLegalPage(), kind: undefined },
  ])('passes $case', async ({ page, kind }) => {
    await expect(validateAgainst([page], kind)).resolves.toBe(true);
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
