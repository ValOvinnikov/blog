import { describe, expect, it, vi } from 'vitest';

import { makeRawSiteSettings } from '#/testing/global/fixtures';
import { mockRun } from '#/testing/mock-run-query';

import { getSiteSettings } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getSiteSettings', () => {
  it('returns null when site settings are not configured', async () => {
    mockRun.mockResolvedValue(null);

    const result = await getSiteSettings();

    expect(result).toBeNull();
  });

  it('maps raw site settings into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        title: 'Awesome Blog',
        description: 'Great content',
      })
    );

    const result = await getSiteSettings();

    expect(result).not.toBeNull();
    expect(result?.title).toBe('Awesome Blog');
    expect(result?.description).toBe('Great content');
    expect(result?.navigation).toEqual([]);
    expect(result?.socialLinks).toEqual([]);
  });
});
