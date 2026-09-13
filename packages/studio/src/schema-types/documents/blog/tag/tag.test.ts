import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag/tag';
import { getCustomValidatorWithLevel } from '@blog/studio/testing/create-mock-validation-rule';
import type { SanityDocument, ValidationContext } from 'sanity';

type TCustomFn = (
  document: SanityDocument | undefined,
  context: ValidationContext,
) => Promise<string | true>;

const MISSING_PAGE_WARNING =
  'No Tag Page references this tag yet — /tags/{slug} will 404 until one is created.';

const getHasPageTagValidator = (): { fn: TCustomFn; isWarning: boolean } =>
  getCustomValidatorWithLevel<TCustomFn>(tagSchema);

const createMockContext = (referencingCount: number) => {
  const fetchCalls: { query: string; params: unknown }[] = [];
  const withConfigCalls: unknown[] = [];

  const getClient = () => ({
    withConfig: (config: unknown) => {
      withConfigCalls.push(config);

      return {
        fetch: async (query: string, params: unknown) => {
          fetchCalls.push({ query, params });
          return referencingCount;
        },
      };
    },
  });

  const context = { getClient } as unknown as ValidationContext;

  return { context, fetchCalls, withConfigCalls };
};

describe('validateHasPageTag', () => {
  it('is registered at warning severity, not error', () => {
    const { isWarning } = getHasPageTagValidator();

    expect(isWarning).toBe(true);
  });

  it('passes without querying when the document has no id', async () => {
    const { fn: validate } = getHasPageTagValidator();
    const { context, fetchCalls } = createMockContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when a page_tag references this tag', async () => {
    const { fn: validate } = getHasPageTagValidator();
    const { context } = createMockContext(1);
    const document = { _id: 'tag-1', _type: 'blog_tag' } as SanityDocument;

    await expect(validate(document, context)).resolves.toBe(true);
  });

  it('warns when no page_tag references this tag', async () => {
    const { fn: validate } = getHasPageTagValidator();
    const { context } = createMockContext(0);
    const document = { _id: 'tag-1', _type: 'blog_tag' } as SanityDocument;

    await expect(validate(document, context)).resolves.toBe(
      MISSING_PAGE_WARNING,
    );
  });

  it('strips the drafts. prefix and queries the drafts perspective', async () => {
    const { fn: validate } = getHasPageTagValidator();
    const { context, fetchCalls, withConfigCalls } = createMockContext(0);
    const document = {
      _id: 'drafts.tag-1',
      _type: 'blog_tag',
    } as SanityDocument;

    await validate(document, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: 'page_tag',
      tagId: 'tag-1',
    });
    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});
