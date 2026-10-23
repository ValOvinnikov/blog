import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { validateUniqueTaxonomyReference } from '@blog/studio/schema-types/validation/validate-unique-taxonomy-reference/validate-unique-taxonomy-reference';
import {
  MOCK_TAXONOMY_REFERENCE_FIELD,
  mockFetchContext,
  type TMockFetchContext,
} from '@blog/studio/testing/mock-validation-context';

const TAG_PAGE_ID = 'page-tag-1';

const UNIQUENESS_ERROR =
  'Another Tag Page already references this tag — each tag can only back one Tag Page.';

describe('validateUniqueTaxonomyReference', () => {
  let validate: ReturnType<typeof validateUniqueTaxonomyReference>;

  beforeEach(() => {
    validate = validateUniqueTaxonomyReference(
      PAGE_TAG_TYPE,
      MOCK_TAXONOMY_REFERENCE_FIELD,
      UNIQUENESS_ERROR,
    );
  });

  describe('when no conflicting page exists', () => {
    let context: TMockFetchContext['context'];
    let fetchCalls: TMockFetchContext['fetchCalls'];
    let withConfigCalls: TMockFetchContext['withConfigCalls'];

    beforeEach(() => {
      ({ context, fetchCalls, withConfigCalls } = mockFetchContext(0, {
        _id: TAG_PAGE_ID,
      }));
    });

    it('passes without querying when no reference is set', async () => {
      await expect(validate(undefined, context)).resolves.toBe(true);
      expect(fetchCalls).toHaveLength(0);
    });

    it('passes when no other page references the same term', async () => {
      await expect(validate({ _ref: 'tag-1' }, context)).resolves.toBe(true);
    });

    it('matches only pages without a language when the page has none', async () => {
      await validate({ _ref: 'tag-1' }, context);

      expect(fetchCalls[0]?.params).toMatchObject({ language: '' });
    });

    it('requests the drafts perspective so an unpublished conflict still counts', async () => {
      await validate({ _ref: 'tag-1' }, context);

      expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
    });

    it('interpolates the given reference field name into the query', async () => {
      const validateTopic = validateUniqueTaxonomyReference(
        PAGE_TOPIC_TYPE,
        'topic',
        'Another Topic Page already references this topic — each topic can only back one Topic Page.',
      );

      await validateTopic({ _ref: 'topic-1' }, context);

      expect(fetchCalls[0]?.query).toContain('topic._ref == $refId');
    });
  });

  it('flags a conflicting page referencing the same term', async () => {
    const { context } = mockFetchContext(1, { _id: TAG_PAGE_ID });

    await expect(validate({ _ref: 'tag-1' }, context)).resolves.toBe(
      UNIQUENESS_ERROR,
    );
  });

  it('resolves to true, not the uniqueness error, when the fetch rejects', async () => {
    const { context } = mockFetchContext(new Error('network down'), {
      _id: TAG_PAGE_ID,
    });

    await expect(validate({ _ref: 'tag-1' }, context)).resolves.toBe(true);
  });

  it('excludes both the draft and published id of the current document', async () => {
    const { context, fetchCalls } = mockFetchContext(0, {
      _id: 'drafts.page-tag-1',
    });

    await validate({ _ref: 'tag-1' }, context);

    expect(fetchCalls[0]?.params).toMatchObject({
      publishedId: TAG_PAGE_ID,
    });
  });

  it('only counts pages in the same language as a conflict', async () => {
    const { context, fetchCalls } = mockFetchContext(0, {
      _id: TAG_PAGE_ID,
      language: LOCALE_ISO_CODES.NL,
    });

    await validate({ _ref: 'tag-1' }, context);

    expect(fetchCalls[0]?.query).toContain(
      'coalesce(language, "") == $language',
    );
    expect(fetchCalls[0]?.params).toMatchObject({
      language: LOCALE_ISO_CODES.NL,
    });
  });
});
