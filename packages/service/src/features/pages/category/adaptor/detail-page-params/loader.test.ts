import { mockRun } from '@blog/service/testing/mock-run-query';
import { describe, expect, it, vi } from 'vitest';

import { getCategoryParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
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
