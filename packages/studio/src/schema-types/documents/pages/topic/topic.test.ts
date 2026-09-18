import { topicPageSchema } from '@blog/studio/schema-types/documents/pages/topic/topic';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import {
  getRecordedValidators,
  type TRecordedValidator,
} from '@blog/studio/testing/create-mock-validation-rule';
import type { ValidationContext } from 'sanity';

type TDocumentCustomFn = (
  document: Record<string, unknown>,
  context: ValidationContext,
) => string | true | Promise<string | true>;

const buildDocumentRules = (): TRecordedValidator<TDocumentCustomFn>[] =>
  getRecordedValidators<TDocumentCustomFn>(topicPageSchema);

describe('topicPageSchema document validation', () => {
  it('the single-post-list rule errors when more than one module_postList is referenced', () => {
    const [singlePostListRule] = buildDocumentRules();

    expect(
      singlePostListRule?.fn?.(
        {
          modules: [
            { _type: postListSchema.name, _ref: 'list-1' },
            { _type: postListSchema.name, _ref: 'list-2' },
          ],
        },
        {} as ValidationContext,
      ),
    ).toBe('Only one Post List module is allowed per page.');
  });

  it('the has-post-list rule warns with page-scoped copy when none is referenced', () => {
    const [, hasPostListRule] = buildDocumentRules();

    expect(
      hasPostListRule?.fn?.(
        { modules: [{ _type: postLatestSchema.name, _ref: 'latest-1' }] },
        {} as ValidationContext,
      ),
    ).toBe(
      'This page has no Post List module — the archive will be empty until one is added.',
    );
  });

  it('the unique-post-list-reference rule flags a conflicting page_topic with page-scoped copy', async () => {
    const [, , uniquePostListRule] = buildDocumentRules();
    const fetchCalls: { query: string; params: unknown }[] = [];

    const context = {
      getClient: () => ({
        withConfig: () => ({
          fetch: async (query: string, params: unknown) => {
            fetchCalls.push({ query, params });
            return 1;
          },
        }),
      }),
    } as unknown as ValidationContext;

    await expect(
      uniquePostListRule?.fn?.(
        {
          _id: 'page-topic-1',
          modules: [{ _type: postListSchema.name, _ref: 'post-list-1' }],
        },
        context,
      ),
    ).resolves.toBe(
      'Another Topic Page already references this Post List — each Post List can only back one Topic Page.',
    );
    expect(fetchCalls[0]?.params).toMatchObject({ type: PAGE_TOPIC_TYPE });
  });
});
