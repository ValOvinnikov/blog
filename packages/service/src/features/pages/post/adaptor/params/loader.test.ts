import { describe, expect, it, vi } from 'vitest';

import { mockRun } from '#/testing/mock-run-query';

import { getPostParams } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPostParams', () => {
  it('returns all slug entries', async () => {
    mockRun.mockResolvedValue([{ slug: 'post-a' }, { slug: 'post-b' }]);

    const params = await getPostParams();

    expect(params).toEqual([{ slug: 'post-a' }, { slug: 'post-b' }]);
  });

  it('returns an empty array when there are no posts', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getPostParams();

    expect(params).toEqual([]);
  });
});
