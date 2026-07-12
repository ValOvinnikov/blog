import { makeRawCategory } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { describe, expect, it, vi } from 'vitest';

import { getCategories } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getCategories', () => {
  it('maps every raw category into a domain category', async () => {
    mockRun.mockResolvedValue([
      makeRawCategory({ _id: 'a', title: 'Design', slug: 'design' }),
      makeRawCategory({ _id: 'b', title: 'Engineering', slug: 'engineering' }),
    ]);

    const result = await getCategories();

    expect(result.map((c) => c.id)).toEqual(['a', 'b']);
    expect(result[0]?.title).toBe('Design');
  });

  it('returns an empty list when there are no categories', async () => {
    mockRun.mockResolvedValue([]);

    const result = await getCategories();

    expect(result).toEqual([]);
  });
});
