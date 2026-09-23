import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { validateHasPage } from '@blog/studio/schema-types/validation/validate-has-page/validate-has-page';
import { createMockCountContext } from '@blog/studio/testing/create-mock-count-context';
import type { SanityDocument } from 'sanity';

const asDocument = (doc: Record<string, unknown>): SanityDocument =>
  doc as unknown as SanityDocument;

const PAGE_TYPE = PAGE_TAG_TYPE;
const REFERENCE_FIELD = 'tag';
const MISSING_PAGE_ERROR =
  'No Tag Page references this tag yet — /tags/{slug} will 404 until one is created.';

describe('validateHasPage', () => {
  const validate = validateHasPage(
    PAGE_TYPE,
    REFERENCE_FIELD,
    MISSING_PAGE_ERROR,
  );

  it('passes without querying when the document has no id', async () => {
    const { context, fetchCalls } = createMockCountContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when a page references the term', async () => {
    const { context } = createMockCountContext(1);
    const document = asDocument({ _id: 'tag-1', _type: 'blog_tag' });

    await expect(validate(document, context)).resolves.toBe(true);
  });

  it('errors when no page references the term', async () => {
    const { context } = createMockCountContext(0);
    const document = asDocument({ _id: 'tag-1', _type: 'blog_tag' });

    await expect(validate(document, context)).resolves.toBe(MISSING_PAGE_ERROR);
  });

  it('strips the drafts. prefix and queries the drafts perspective', async () => {
    const { context, fetchCalls, withConfigCalls } = createMockCountContext(0);
    const document = asDocument({ _id: 'drafts.tag-1', _type: 'blog_tag' });

    await validate(document, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: PAGE_TYPE,
      id: 'tag-1',
    });
    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });

  it('resolves to true, not the error, when the fetch rejects', async () => {
    const { context } = createMockCountContext(new Error('network down'));
    const document = asDocument({ _id: 'tag-1', _type: 'blog_tag' });

    await expect(validate(document, context)).resolves.toBe(true);
  });

  it('interpolates the given reference field name into the query', async () => {
    const { context, fetchCalls } = createMockCountContext(0);
    const validateTopic = validateHasPage(
      PAGE_TOPIC_TYPE,
      'topic',
      'No Topic Page references this topic yet — /topics/{slug} will 404 until one is created.',
    );
    const document = asDocument({ _id: 'topic-1', _type: 'blog_topic' });

    await validateTopic(document, context);

    expect(fetchCalls[0]?.query).toContain('topic._ref == $id');
  });
});
