import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { validateUniqueTaxonomyReference } from '@blog/studio/schema-types/validation/validate-unique-taxonomy-reference/validate-unique-taxonomy-reference';
import {
  mockDocument,
  mockReference,
} from '@blog/studio/testing/mock-documents';
import { MOCK_FETCH_ERROR } from '@blog/studio/testing/mock-fetch-error';
import {
  MOCK_TAXONOMY_REFERENCE_FIELD,
  mockFetchContext,
  mockGroqValidationContext,
} from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import { getDraftId } from 'sanity';

faker.seed(6023);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_OTHER_PAGE_ID = faker.string.uuid();
const MOCK_TERM_ID = faker.string.uuid();
const MOCK_OTHER_TERM_ID = faker.string.uuid();
const MOCK_TOPIC_REFERENCE_FIELD = faker.lorem.word();
const MOCK_UNIQUENESS_ERROR = faker.lorem.sentence();

const termReference = mockReference(MOCK_TERM_ID);

const mockTagPage = (fields: Record<string, unknown> = {}) =>
  mockDocument({
    _id: MOCK_PAGE_ID,
    _type: PAGE_TAG_TYPE,
    language: EN,
    [MOCK_TAXONOMY_REFERENCE_FIELD]: termReference,
    ...fields,
  });

const ownDraft = mockTagPage({ _id: getDraftId(MOCK_PAGE_ID) });

describe(validateUniqueTaxonomyReference, () => {
  let validate: ReturnType<typeof validateUniqueTaxonomyReference>;

  beforeEach(() => {
    validate = validateUniqueTaxonomyReference(
      PAGE_TAG_TYPE,
      MOCK_TAXONOMY_REFERENCE_FIELD,
      MOCK_UNIQUENESS_ERROR,
    );
  });

  it('flags another page in the same language referencing the same term', async () => {
    const conflict = mockTagPage({ _id: MOCK_OTHER_PAGE_ID });

    await expect(
      validate(
        termReference,
        mockGroqValidationContext([conflict], { document: ownDraft }),
      ),
    ).resolves.toBe(MOCK_UNIQUENESS_ERROR);
  });

  it('flags a conflicting page that is only a draft', async () => {
    const draftConflict = mockTagPage({ _id: getDraftId(MOCK_OTHER_PAGE_ID) });

    await expect(
      validate(
        termReference,
        mockGroqValidationContext([draftConflict], { document: ownDraft }),
      ),
    ).resolves.toBe(MOCK_UNIQUENESS_ERROR);
  });

  it('reads pages through the drafts perspective', async () => {
    const { context, withConfigCalls } = mockFetchContext(0, ownDraft);

    await validate(termReference, context);

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });

  it('passes when no other page references the same term', async () => {
    const otherTermPage = mockTagPage({
      _id: MOCK_OTHER_PAGE_ID,
      [MOCK_TAXONOMY_REFERENCE_FIELD]: mockReference(MOCK_OTHER_TERM_ID),
    });

    await expect(
      validate(
        termReference,
        mockGroqValidationContext([otherTermPage], { document: ownDraft }),
      ),
    ).resolves.toBe(true);
  });

  it('does not count the draft or published copy of the same page', async () => {
    const publishedSelf = mockTagPage();

    await expect(
      validate(
        termReference,
        mockGroqValidationContext([publishedSelf, ownDraft], {
          document: ownDraft,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('passes a page in another language referencing the same term', async () => {
    const dutchPage = mockTagPage({ _id: MOCK_OTHER_PAGE_ID, language: NL });

    await expect(
      validate(
        termReference,
        mockGroqValidationContext([dutchPage], { document: ownDraft }),
      ),
    ).resolves.toBe(true);
  });

  it.each([
    { case: 'passes a page in a language', language: EN, expected: true },
    {
      case: 'flags a page without a language',
      language: undefined,
      expected: MOCK_UNIQUENESS_ERROR,
    },
  ])('for a page without a language, $case', async ({ language, expected }) => {
    const unlocalizedDraft = mockTagPage({
      _id: getDraftId(MOCK_PAGE_ID),
      language: undefined,
    });
    const otherPage = mockTagPage({ _id: MOCK_OTHER_PAGE_ID, language });

    await expect(
      validate(
        termReference,
        mockGroqValidationContext([otherPage], {
          document: unlocalizedDraft,
        }),
      ),
    ).resolves.toBe(expected);
  });

  it('matches the term on the reference field it is given', async () => {
    const validateTopic = validateUniqueTaxonomyReference(
      PAGE_TOPIC_TYPE,
      MOCK_TOPIC_REFERENCE_FIELD,
      MOCK_UNIQUENESS_ERROR,
    );
    const conflict = mockDocument({
      _id: MOCK_OTHER_PAGE_ID,
      _type: PAGE_TOPIC_TYPE,
      language: EN,
      [MOCK_TOPIC_REFERENCE_FIELD]: termReference,
    });

    await expect(
      validateTopic(
        termReference,
        mockGroqValidationContext([conflict], { document: ownDraft }),
      ),
    ).resolves.toBe(MOCK_UNIQUENESS_ERROR);
  });

  it('passes when no reference is set', async () => {
    const conflict = mockTagPage({ _id: MOCK_OTHER_PAGE_ID });

    await expect(
      validate(
        undefined,
        mockGroqValidationContext([conflict], { document: ownDraft }),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validate(
        termReference,
        mockGroqValidationContext([], {
          document: ownDraft,
          fetchError: MOCK_FETCH_ERROR,
        }),
      ),
    ).resolves.toBe(true);
  });
});
