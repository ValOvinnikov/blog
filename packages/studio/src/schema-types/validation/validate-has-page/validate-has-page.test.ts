import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { validateHasPage } from '@blog/studio/schema-types/validation/validate-has-page/validate-has-page';
import { mockDocument } from '@blog/studio/testing/mock-documents';
import {
  MOCK_TAXONOMY_REFERENCE_FIELD,
  mockFetchContext,
  type TMockFetchContext,
} from '@blog/studio/testing/mock-validation-context';
import type { SanityDocument } from 'sanity';

const MISSING_PAGE_ERROR = 'No Tag Page references this tag yet.';

describe('validateHasPage', () => {
  const validate = validateHasPage(
    PAGE_TAG_TYPE,
    MOCK_TAXONOMY_REFERENCE_FIELD,
    MISSING_PAGE_ERROR,
  );

  let document: SanityDocument;

  beforeEach(() => {
    document = mockDocument({ _id: 'tag-1', _type: 'blog_tag' });
  });

  describe('when no page references the term', () => {
    let context: TMockFetchContext['context'];
    let fetchCalls: TMockFetchContext['fetchCalls'];
    let withConfigCalls: TMockFetchContext['withConfigCalls'];

    beforeEach(() => {
      ({ context, fetchCalls, withConfigCalls } = mockFetchContext(0));
    });

    it('passes without querying when the document has no id', async () => {
      await expect(validate(undefined, context)).resolves.toBe(true);
      expect(fetchCalls).toHaveLength(0);
    });

    it('errors when no page references the term', async () => {
      await expect(validate(document, context)).resolves.toBe(
        MISSING_PAGE_ERROR,
      );
    });

    it('strips the drafts. prefix and queries the drafts perspective', async () => {
      const document = mockDocument({ _id: 'drafts.tag-1', _type: 'blog_tag' });

      await validate(document, context);

      expect(fetchCalls[0]?.params).toEqual({
        type: PAGE_TAG_TYPE,
        id: 'tag-1',
      });
      expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
    });

    it('interpolates the given reference field name into the query', async () => {
      const validateTopic = validateHasPage(
        PAGE_TOPIC_TYPE,
        'topic',
        'No Topic Page references this topic yet.',
      );
      const document = mockDocument({ _id: 'topic-1', _type: 'blog_topic' });

      await validateTopic(document, context);

      expect(fetchCalls[0]?.query).toContain('topic._ref == $id');
    });
  });

  it('passes when a page references the term', async () => {
    const { context } = mockFetchContext(1);

    await expect(validate(document, context)).resolves.toBe(true);
  });

  it('resolves to true, not the error, when the fetch rejects', async () => {
    const { context } = mockFetchContext(new Error('network down'));

    await expect(validate(document, context)).resolves.toBe(true);
  });
});
