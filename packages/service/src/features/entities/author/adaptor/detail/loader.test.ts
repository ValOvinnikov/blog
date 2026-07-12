import { makeRawAuthor } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { describe, expect, it, vi } from 'vitest';

import { getAuthor } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getAuthor', () => {
  it('returns null when the author is not found', async () => {
    mockRun.mockResolvedValue(null);

    const result = await getAuthor('unknown-slug');

    expect(result).toBeNull();
  });

  it('maps the raw author into a domain detail object', async () => {
    mockRun.mockResolvedValue(
      makeRawAuthor({ _id: 'author-abc', name: 'John Smith' }),
    );

    const result = await getAuthor('john-smith');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('author-abc');
    expect(result?.name).toBe('John Smith');
    expect(result?.socialLinks).toEqual([]);
  });

  it('passes the slug as a query parameter', async () => {
    mockRun.mockResolvedValue(null);

    await getAuthor('my-author');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'my-author' } }),
    );
  });
});
