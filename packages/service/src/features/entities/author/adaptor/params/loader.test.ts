import { describe, expect, it, vi } from 'vitest';

import { mockRun } from '#/testing/mock-run-query';

import { getAuthorParams } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getAuthorParams', () => {
  it('returns all slug entries', async () => {
    mockRun.mockResolvedValue([{ slug: 'jane-doe' }, { slug: 'john-smith' }]);

    const params = await getAuthorParams();

    expect(params).toEqual([{ slug: 'jane-doe' }, { slug: 'john-smith' }]);
  });

  it('returns an empty array when there are no authors', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getAuthorParams();

    expect(params).toEqual([]);
  });
});
