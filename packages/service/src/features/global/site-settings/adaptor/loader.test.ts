import { describe, expect, it, vi } from 'vitest';

import { makeRawSiteSettings } from '#/testing/global/fixtures';
import { mockRun } from '#/testing/mock-run-query';

import { getSiteSettings } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getSiteSettings', () => {
  it('throws when site settings document does not exist', async () => {
    mockRun.mockResolvedValue(null);

    await expect(getSiteSettings()).rejects.toThrow();
  });

  it('maps raw site settings into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        title: 'Awesome Blog',
        description: 'Great content',
        brandPrefix: 'val',
        brandSuffix: '.dev',
      }),
    );

    const result = await getSiteSettings();

    expect(result.title).toBe('Awesome Blog');
    expect(result.description).toBe('Great content');
    expect(result.brandPrefix).toBe('val');
    expect(result.brandSuffix).toBe('.dev');
    expect(result.navigation).toEqual([]);
    expect(result.socialLinks).toEqual([]);
  });
});
