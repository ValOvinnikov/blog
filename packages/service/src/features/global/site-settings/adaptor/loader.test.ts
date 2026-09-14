import {
  BRAND_TAGLINE_SEPARATOR_CHARS,
  BRAND_TAGLINE_SEPARATORS,
} from '@blog/config';
import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawSanityImage } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getSiteSettings } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getSiteSettings', () => {
  it('throws when site settings document does not exist', async () => {
    mockRun.mockResolvedValue(null);

    await expect(getSiteSettings(tenant)).rejects.toThrow();
  });

  it('maps raw site settings into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          tagline: {
            items: ['build 2026.07', 'online'],
            separator: BRAND_TAGLINE_SEPARATORS.DOT,
          },
          logo: makeRawSanityImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.name).toBe('Awesome Blog');
    expect(result.brand.tagline).toBe(
      `build 2026.07 ${BRAND_TAGLINE_SEPARATOR_CHARS.DOT} online`,
    );
  });

  it('maps a missing tagline to undefined', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          tagline: null,
          logo: makeRawSanityImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.tagline).toBeUndefined();
  });

  it('joins multiple tagline items with the mapped separator', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          tagline: {
            items: ['build 2026.07', 'online'],
            separator: BRAND_TAGLINE_SEPARATORS.PIPE,
          },
          logo: makeRawSanityImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.tagline).toBe(
      `build 2026.07 ${BRAND_TAGLINE_SEPARATOR_CHARS.PIPE} online`,
    );
  });

  it('joins tagline items with the Bullet separator', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          tagline: {
            items: ['build 2026.07', 'online'],
            separator: BRAND_TAGLINE_SEPARATORS.BULLET,
          },
          logo: makeRawSanityImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.tagline).toBe(
      `build 2026.07 ${BRAND_TAGLINE_SEPARATOR_CHARS.BULLET} online`,
    );
  });

  it('joins tagline items with the Slash separator', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          tagline: {
            items: ['build 2026.07', 'online'],
            separator: BRAND_TAGLINE_SEPARATORS.SLASH,
          },
          logo: makeRawSanityImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.tagline).toBe(
      `build 2026.07 ${BRAND_TAGLINE_SEPARATOR_CHARS.SLASH} online`,
    );
  });

  it('joins a single tagline item with no separator character', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          tagline: {
            items: ['online'],
            separator: BRAND_TAGLINE_SEPARATORS.DOT,
          },
          logo: makeRawSanityImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.tagline).toBe('online');
  });

  it('maps an empty tagline items list to undefined', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          tagline: { items: [], separator: BRAND_TAGLINE_SEPARATORS.DOT },
          logo: makeRawSanityImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.tagline).toBeUndefined();
  });

  it('leaves logo undefined when no logo is uploaded', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          tagline: null,
          logo: null,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.logo).toBeUndefined();
  });

  it('maps an uploaded logo to an image view-model', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          tagline: null,
          logo: makeRawSanityImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.logo).toEqual(
      expect.objectContaining({ assetId: 'image-abc123-800x600-jpg' }),
    );
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawSiteSettings());

    await getSiteSettings(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:site-settings'] }),
      }),
    );
  });
});
