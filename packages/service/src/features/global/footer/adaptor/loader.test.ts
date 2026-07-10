import { describe, expect, it, vi } from 'vitest';

import { makeRawFooter } from '#/testing/global/fixtures';
import { mockRun } from '#/testing/mock-run-query';

import { getFooter } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getFooter', () => {
  it('throws when the footer document does not exist', async () => {
    mockRun.mockResolvedValue(null);

    await expect(getFooter()).rejects.toThrow();
  });

  it('defaults social to an empty array when none are set', async () => {
    mockRun.mockResolvedValue(makeRawFooter({ social: null }));

    const result = await getFooter();

    expect(result.social).toEqual([]);
  });

  it('maps raw social links into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawFooter({
        social: [
          {
            label: 'GitHub',
            linkType: 'external',
            url: 'https://github.com/val',
            internalReference: null,
            openInNewTab: null,
            platform: 'github',
          },
        ],
      }),
    );

    const result = await getFooter();

    expect(result.social).toEqual([
      {
        label: 'GitHub',
        href: 'https://github.com/val',
        target: undefined,
        platform: 'github',
      },
    ]);
  });
});
