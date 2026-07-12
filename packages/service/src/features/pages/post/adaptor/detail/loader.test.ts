import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostDetail } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getPost } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPost', () => {
  it('returns null when the post is not found', async () => {
    mockRun.mockResolvedValue(null);

    const result = await getPost('missing-slug');

    expect(result).toBeNull();
  });

  it('maps the raw post into a domain detail object', async () => {
    mockRun.mockResolvedValue(
      makeRawPostDetail({ _id: 'post-abc', title: 'Test Post' }),
    );

    const result = await getPost('test-post');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('post-abc');
    expect(result?.title).toBe('Test Post');
    expect(result?.slug).toBe('hello-world');
  });

  it('passes the slug as a query parameter', async () => {
    mockRun.mockResolvedValue(null);

    await getPost('my-slug');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'my-slug' } }),
    );
  });
});
