import { describe, expect, it, vi } from 'vitest';

import { makeRawCategory } from '#/testing/entities/fixtures';
import { mockRun } from '#/testing/mock-run-query';

import { getCategories } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
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
