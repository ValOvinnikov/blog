import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { validateUniquePostListReference } from '@blog/studio/schema-types/validation/validate-unique-post-list-reference/validate-unique-post-list-reference';
import type { SanityDocument, ValidationContext } from 'sanity';

const PAGE_TYPE = PAGE_TAG_TYPE;
const UNIQUENESS_ERROR =
  'Another Tag Page already references this Post List — each Post List can only back one Tag Page.';

const asDocument = (doc: Record<string, unknown>): SanityDocument =>
  doc as unknown as SanityDocument;

const createMockContext = (fetchResult: unknown) => {
  const fetchCalls: { query: string; params: unknown }[] = [];
  const withConfigCalls: unknown[] = [];

  const getClient = () => ({
    withConfig: (config: unknown) => {
      withConfigCalls.push(config);

      return {
        fetch: async (query: string, params: unknown) => {
          fetchCalls.push({ query, params });
          return fetchResult;
        },
      };
    },
  });

  const context = { getClient } as unknown as ValidationContext;

  return { context, fetchCalls, withConfigCalls };
};

describe('validateUniquePostListReference', () => {
  it('passes without querying when modules[] carries no post list reference', async () => {
    const validate = validateUniquePostListReference(
      PAGE_TYPE,
      UNIQUENESS_ERROR,
    );
    const { context, fetchCalls } = createMockContext(0);

    await expect(validate(asDocument({}), context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('reads the reference from modules[] when present', async () => {
    const validate = validateUniquePostListReference(
      PAGE_TYPE,
      UNIQUENESS_ERROR,
    );
    const { context, fetchCalls } = createMockContext(0);

    await validate(
      asDocument({
        _id: 'page-tag-1',
        modules: [{ _type: postListSchema.name, _ref: 'post-list-1' }],
      }),
      context,
    );

    expect(fetchCalls[0]?.params).toMatchObject({ postListId: 'post-list-1' });
  });

  it('flags a conflicting page referencing the same modules[] post list', async () => {
    const validate = validateUniquePostListReference(
      PAGE_TYPE,
      UNIQUENESS_ERROR,
    );
    const { context } = createMockContext(1);

    await expect(
      validate(
        asDocument({
          _id: 'page-tag-1',
          modules: [{ _type: postListSchema.name, _ref: 'post-list-1' }],
        }),
        context,
      ),
    ).resolves.toBe(UNIQUENESS_ERROR);
  });

  it('excludes both the draft and published id of the current document', async () => {
    const validate = validateUniquePostListReference(
      PAGE_TYPE,
      UNIQUENESS_ERROR,
    );
    const { context, fetchCalls } = createMockContext(0);

    await validate(
      asDocument({
        _id: 'drafts.page-tag-1',
        modules: [{ _type: postListSchema.name, _ref: 'post-list-1' }],
      }),
      context,
    );

    expect(fetchCalls[0]?.params).toEqual({
      type: PAGE_TYPE,
      postListId: 'post-list-1',
      publishedId: 'page-tag-1',
    });
  });

  it('requests the drafts perspective so an unpublished conflict still counts', async () => {
    const validate = validateUniquePostListReference(
      PAGE_TYPE,
      UNIQUENESS_ERROR,
    );
    const { context, withConfigCalls } = createMockContext(0);

    await validate(
      asDocument({
        _id: 'page-tag-1',
        modules: [{ _type: postListSchema.name, _ref: 'post-list-1' }],
      }),
      context,
    );

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});
