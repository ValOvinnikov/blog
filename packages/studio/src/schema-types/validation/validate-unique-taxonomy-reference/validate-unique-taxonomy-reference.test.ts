import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { validateUniqueTaxonomyReference } from '@blog/studio/schema-types/validation/validate-unique-taxonomy-reference/validate-unique-taxonomy-reference';
import type { ValidationContext } from 'sanity';

const PAGE_TYPE = PAGE_TAG_TYPE;
const REFERENCE_FIELD = 'tag';
const UNIQUENESS_ERROR =
  'Another Tag Page already references this tag — each tag can only back one Tag Page.';

const createMockContext = (fetchResult: unknown, documentId = 'page-tag-1') => {
  const fetchCalls: { query: string; params: unknown }[] = [];
  const withConfigCalls: unknown[] = [];

  const getClient = () => ({
    withConfig: (config: unknown) => {
      withConfigCalls.push(config);

      return {
        fetch: async (query: string, params: unknown) => {
          fetchCalls.push({ query, params });
          if (fetchResult instanceof Error) throw fetchResult;
          return fetchResult;
        },
      };
    },
  });

  const context = {
    getClient,
    document: { _id: documentId },
  } as unknown as ValidationContext;

  return { context, fetchCalls, withConfigCalls };
};

describe('validateUniqueTaxonomyReference', () => {
  const validate = () =>
    validateUniqueTaxonomyReference(
      PAGE_TYPE,
      REFERENCE_FIELD,
      UNIQUENESS_ERROR,
    );

  it('passes without querying when no reference is set', async () => {
    const { context, fetchCalls } = createMockContext(0);

    await expect(validate()(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when no other page references the same term', async () => {
    const { context } = createMockContext(0);

    await expect(validate()({ _ref: 'tag-1' }, context)).resolves.toBe(true);
  });

  it('flags a conflicting page referencing the same term', async () => {
    const { context } = createMockContext(1);

    await expect(validate()({ _ref: 'tag-1' }, context)).resolves.toBe(
      UNIQUENESS_ERROR,
    );
  });

  it('resolves to true, not the uniqueness error, when the fetch rejects', async () => {
    const { context } = createMockContext(new Error('network down'));

    await expect(validate()({ _ref: 'tag-1' }, context)).resolves.toBe(true);
  });

  it('excludes both the draft and published id of the current document', async () => {
    const { context, fetchCalls } = createMockContext(0, 'drafts.page-tag-1');

    await validate()({ _ref: 'tag-1' }, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: PAGE_TYPE,
      refId: 'tag-1',
      publishedId: 'page-tag-1',
    });
  });

  it('requests the drafts perspective so an unpublished conflict still counts', async () => {
    const { context, withConfigCalls } = createMockContext(0);

    await validate()({ _ref: 'tag-1' }, context);

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });

  it('interpolates the given reference field name into the query', async () => {
    const { context, fetchCalls } = createMockContext(0);
    const validateTopic = validateUniqueTaxonomyReference(
      PAGE_TOPIC_TYPE,
      'topic',
      'Another Topic Page already references this topic — each topic can only back one Topic Page.',
    );

    await validateTopic({ _ref: 'topic-1' }, context);

    expect(fetchCalls[0]?.query).toContain('topic._ref == $refId');
  });
});
