import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPostTaxonomySlugs } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getPostTaxonomySlugs, () => {
  it('resolves undefined, rather than rejecting, when the id matches no blog_post', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getPostTaxonomySlugs('missing-id', tenant);

    expect(result).toBeUndefined();
  });

  it('maps the raw taxonomy into tag and topic slugs', async () => {
    mockRun.mockResolvedValueOnce({
      tagSlugs: [{ slug: 'typescript' }],
      topicSlug: { slug: 'engineering' },
    });

    const result = await getPostTaxonomySlugs('post-1', tenant);

    expect(result).toEqual({
      tagSlugs: ['typescript'],
      topicSlug: 'engineering',
    });
  });

  it('passes the post id as a query parameter', async () => {
    mockRun.mockResolvedValueOnce({ tagSlugs: [], topicSlug: null });

    await getPostTaxonomySlugs('post-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { postId: 'post-1' } }),
    );
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValueOnce({ tagSlugs: [], topicSlug: null });

    await getPostTaxonomySlugs('post-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:posts',
            't:tenant-a:page_tag',
            't:tenant-a:page_topic',
          ],
        }),
      }),
    );
  });
});
