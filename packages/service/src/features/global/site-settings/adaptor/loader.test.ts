import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawImage } from '@blog/service/testing/shared/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getSiteSettings } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
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
        description: 'Great content',
        brand: {
          name: 'Awesome Blog',
          prefix: 'val',
          suffix: '.dev',
          logo: makeRawImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings();

    expect(result.description).toBe('Great content');
    expect(result.brand.name).toBe('Awesome Blog');
    expect(result.brand.prefix).toBe('val');
    expect(result.brand.suffix).toBe('.dev');
  });
});
