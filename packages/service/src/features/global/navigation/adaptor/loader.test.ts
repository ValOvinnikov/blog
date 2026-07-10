import { describe, expect, it, vi } from 'vitest';

import { makeRawNavigation } from '#/testing/global/fixtures';
import { mockRun } from '#/testing/mock-run-query';

import { getNavigation } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getNavigation', () => {
  it('throws when the navigation document does not exist', async () => {
    mockRun.mockResolvedValue(null);

    await expect(getNavigation()).rejects.toThrow();
  });

  it('defaults items to an empty array when none are set', async () => {
    mockRun.mockResolvedValue(makeRawNavigation({ items: null }));

    const result = await getNavigation();

    expect(result.items).toEqual([]);
  });

  it('maps raw navigation items into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawNavigation({
        items: [
          {
            label: 'Blog',
            linkType: 'external',
            url: '/blog',
            internalReference: null,
            openInNewTab: null,
            platform: null,
          },
        ],
      }),
    );

    const result = await getNavigation();

    expect(result.items).toEqual([
      { label: 'Blog', href: '/blog', target: undefined, platform: undefined },
    ]);
  });
});
