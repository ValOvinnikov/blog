import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic';
import type { SanityDocument, ValidationContext } from 'sanity';

type TCustomFn = (
  document: SanityDocument | undefined,
  context: ValidationContext,
) => Promise<string | true>;

const MISSING_PAGE_WARNING =
  'No Topic Page references this topic yet — /topics/{slug} will 404 until one is created.';

/**
 * `validateHasPageTopic` is private to topic.ts; the document-level
 * `validation` builder registers it via `rule.custom(fn).warning()`, so a
 * minimal chainable mock rule captures both calls the same way other schema
 * tests capture a field's custom validator — no export needed.
 */
const getHasPageTopicValidator = (): { fn: TCustomFn; isWarning: boolean } => {
  if (!topicSchema.validation) {
    throw new Error('Expected topicSchema to define document validation.');
  }

  let customFn: TCustomFn | undefined;
  let warningCalled = false;

  const rule = {
    custom: (fn: TCustomFn) => {
      customFn = fn;
      return rule;
    },
    warning: () => {
      warningCalled = true;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (topicSchema.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      'Expected topicSchema validation to register a custom() rule.',
    );
  }

  return { fn: customFn, isWarning: warningCalled };
};

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

describe('validateHasPageTopic', () => {
  it('is registered at warning severity, not error', () => {
    const { isWarning } = getHasPageTopicValidator();

    expect(isWarning).toBe(true);
  });

  it('passes without querying when the document has no id', async () => {
    const { fn: validate } = getHasPageTopicValidator();
    const { context, fetchCalls } = createMockContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when a page_topic references this topic', async () => {
    const { fn: validate } = getHasPageTopicValidator();
    const { context } = createMockContext(1);
    const document = { _id: 'topic-1', _type: 'blog_topic' } as SanityDocument;

    await expect(validate(document, context)).resolves.toBe(true);
  });

  it('warns when no page_topic references this topic', async () => {
    const { fn: validate } = getHasPageTopicValidator();
    const { context } = createMockContext(0);
    const document = { _id: 'topic-1', _type: 'blog_topic' } as SanityDocument;

    await expect(validate(document, context)).resolves.toBe(
      MISSING_PAGE_WARNING,
    );
  });

  it('strips the drafts. prefix and queries the drafts perspective', async () => {
    const { fn: validate } = getHasPageTopicValidator();
    const { context, fetchCalls, withConfigCalls } = createMockContext(0);
    const document = {
      _id: 'drafts.topic-1',
      _type: 'blog_topic',
    } as SanityDocument;

    await validate(document, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: 'page_topic',
      topicId: 'topic-1',
    });
    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});
