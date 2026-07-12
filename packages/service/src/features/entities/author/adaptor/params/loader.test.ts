import { mockRun } from '@blog/service/testing/mock-run-query';
import { describe, expect, it, vi } from 'vitest';

import { getAuthorParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
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
