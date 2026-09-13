import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag/tag';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { createMockCountContext } from '@blog/studio/testing/create-mock-count-context';
import { getDocumentValidator } from '@blog/studio/testing/get-document-validator';

const MISSING_PAGE_WARNING =
  'No Tag Page references this tag yet — /tags/{slug} will 404 until one is created.';

describe('tagSchema validation', () => {
  it('registers validateHasPage at warning severity, not error', () => {
    const { isWarning } = getDocumentValidator(tagSchema);

    expect(isWarning).toBe(true);
  });

  it('passes without querying when the document has no id', async () => {
    const { fn: validate } = getDocumentValidator(tagSchema);
    const { context, fetchCalls } = createMockCountContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when a page_tag references this tag', async () => {
    const { fn: validate } = getDocumentValidator(tagSchema);
    const { context } = createMockCountContext(1);

    await expect(validate({ _id: 'tag-1' }, context)).resolves.toBe(true);
  });

  it('warns when no page_tag references this tag', async () => {
    const { fn: validate } = getDocumentValidator(tagSchema);
    const { context } = createMockCountContext(0);

    await expect(validate({ _id: 'tag-1' }, context)).resolves.toBe(
      MISSING_PAGE_WARNING,
    );
  });

  it('strips the drafts. prefix and queries the drafts perspective', async () => {
    const { fn: validate } = getDocumentValidator(tagSchema);
    const { context, fetchCalls, withConfigCalls } = createMockCountContext(0);

    await validate({ _id: 'drafts.tag-1' }, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: PAGE_TAG_TYPE,
      id: 'tag-1',
    });
    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});
