import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { createMockCountContext } from '@blog/studio/testing/create-mock-count-context';
import { getCustomValidatorWithLevel } from '@blog/studio/testing/create-mock-validation-rule';
import type { ValidationContext } from 'sanity';

type TDocFn = (
  document: { _id: string } | undefined,
  context: ValidationContext,
) => Promise<string | true>;

const MISSING_PAGE_WARNING =
  'No Topic Page references this topic yet — /topics/{slug} will 404 until one is created.';

const getHasPageValidator = () =>
  getCustomValidatorWithLevel<TDocFn>(topicSchema);

describe('topicSchema validation', () => {
  it('registers validateHasPage at warning severity, not error', () => {
    const { isWarning } = getHasPageValidator();

    expect(isWarning).toBe(true);
  });

  it('passes without querying when the document has no id', async () => {
    const { fn: validate } = getHasPageValidator();
    const { context, fetchCalls } = createMockCountContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when a page_topic references this topic', async () => {
    const { fn: validate } = getHasPageValidator();
    const { context } = createMockCountContext(1);

    await expect(validate({ _id: 'topic-1' }, context)).resolves.toBe(true);
  });

  it('warns when no page_topic references this topic', async () => {
    const { fn: validate } = getHasPageValidator();
    const { context } = createMockCountContext(0);

    await expect(validate({ _id: 'topic-1' }, context)).resolves.toBe(
      MISSING_PAGE_WARNING,
    );
  });

  it('strips the drafts. prefix and queries the drafts perspective', async () => {
    const { fn: validate } = getHasPageValidator();
    const { context, fetchCalls, withConfigCalls } = createMockCountContext(0);

    await validate({ _id: 'drafts.topic-1' }, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: PAGE_TOPIC_TYPE,
      id: 'topic-1',
    });
    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});
