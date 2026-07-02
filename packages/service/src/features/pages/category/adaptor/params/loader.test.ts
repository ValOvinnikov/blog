import { describe, expect, it, vi } from 'vitest';

import { mockRun } from '#/testing/mock-run-query';

import { getCategoryParams } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getCategoryParams', () => {
  it('returns all slug entries', async () => {
    mockRun.mockResolvedValue([{ slug: 'engineering' }, { slug: 'design' }]);

    const params = await getCategoryParams();

    expect(params).toEqual([{ slug: 'engineering' }, { slug: 'design' }]);
  });

  it('returns an empty array when there are no categories', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getCategoryParams();

    expect(params).toEqual([]);
  });
});
