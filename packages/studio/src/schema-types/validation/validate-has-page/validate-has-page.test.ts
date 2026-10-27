import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { validateHasPage } from '@blog/studio/schema-types/validation/validate-has-page/validate-has-page';
import {
  mockDocument,
  mockReference,
} from '@blog/studio/testing/mock-documents';
import {
  MOCK_TAXONOMY_REFERENCE_FIELD,
  mockFetchContext,
  mockGroqValidationContext,
} from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import { getDraftId } from 'sanity';

faker.seed(6030);

const MOCK_TERM_ID = faker.string.uuid();
const MOCK_MISSING_PAGE_ERROR = faker.lorem.sentence();

const mockTermPage = (_type: string) =>
  mockDocument({
    _id: faker.string.uuid(),
    _type,
    [MOCK_TAXONOMY_REFERENCE_FIELD]: mockReference(MOCK_TERM_ID),
  });

describe(validateHasPage, () => {
  const validate = validateHasPage(
    PAGE_TAG_TYPE,
    MOCK_TAXONOMY_REFERENCE_FIELD,
    MOCK_MISSING_PAGE_ERROR,
  );

  it.each([
    [
      'passes when a page references the term',
      MOCK_TERM_ID,
      [mockTermPage(PAGE_TAG_TYPE)],
      true,
    ],
    [
      'passes a draft term whose published id a page references',
      getDraftId(MOCK_TERM_ID),
      [mockTermPage(PAGE_TAG_TYPE)],
      true,
    ],
    [
      'errors when no page references the term',
      MOCK_TERM_ID,
      [],
      MOCK_MISSING_PAGE_ERROR,
    ],
    [
      'errors when only another page type references the term',
      MOCK_TERM_ID,
      [mockTermPage(PAGE_TOPIC_TYPE)],
      MOCK_MISSING_PAGE_ERROR,
    ],
  ])('%s', async (_description, termId, dataset, expected) => {
    const term = mockDocument({ _id: termId });

    await expect(
      validate(term, mockGroqValidationContext(dataset)),
    ).resolves.toBe(expected);
  });

  it('passes without querying when the document has no id', async () => {
    const { context, fetchCalls } = mockFetchContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toEqual([]);
  });

  it('looks for referencing pages among drafts', async () => {
    const { context, withConfigCalls } = mockFetchContext(0);

    await validate(mockDocument({ _id: MOCK_TERM_ID }), context);

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });

  it('passes when the fetch fails', async () => {
    const context = mockGroqValidationContext([], {
      fetchError: new Error(faker.lorem.sentence()),
    });

    await expect(
      validate(mockDocument({ _id: MOCK_TERM_ID }), context),
    ).resolves.toBe(true);
  });
});
