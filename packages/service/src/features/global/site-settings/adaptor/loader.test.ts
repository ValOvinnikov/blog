import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawImage } from '@blog/service/testing/shared/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getSiteSettings } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
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
          specLine: 'A blog about building things',
          logo: makeRawImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings();

    expect(result.description).toBe('Great content');
    expect(result.brand.name).toBe('Awesome Blog');
    expect(result.brand.prefix).toBe('val');
    expect(result.brand.suffix).toBe('.dev');
    expect(result.brand.specLine).toBe('A blog about building things');
  });

  it('maps a missing spec line to undefined', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          prefix: 'val',
          suffix: '.dev',
          specLine: null,
          logo: makeRawImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings();

    expect(result.brand.specLine).toBeUndefined();
  });

  it('maps the default OG image to a URL', async () => {
    mockRun.mockResolvedValue(makeRawSiteSettings());

    const result = await getSiteSettings();

    expect(result.defaultOgImageUrl).toContain('sanity.io');
  });
});
