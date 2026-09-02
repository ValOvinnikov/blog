import {
  BRAND_VARIANTS,
  SPEC_LINE_SEPARATOR_CHARS,
  SPEC_LINE_SEPARATORS,
} from '@blog/config';
import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawImage } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

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

const tenant = makeTenant();

describe('getSiteSettings', () => {
  it('throws when site settings document does not exist', async () => {
    mockRun.mockResolvedValue(null);

    await expect(getSiteSettings(tenant)).rejects.toThrow();
  });

  it('maps raw site settings into a domain object', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        description: 'Great content',
        brand: {
          name: 'Awesome Blog',
          specLine: {
            items: ['build 2026.07', 'online'],
            separator: SPEC_LINE_SEPARATORS.DOT,
          },
          logo: makeRawImage('Logo'),
          variant: BRAND_VARIANTS.CONSOLE,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.description).toBe('Great content');
    expect(result.brand.name).toBe('Awesome Blog');
    expect(result.brand.specLine).toBe(
      `build 2026.07 ${SPEC_LINE_SEPARATOR_CHARS.DOT} online`,
    );
    expect(result.brand.variant).toBe(BRAND_VARIANTS.CONSOLE);
  });

  it('maps a non-default brand variant', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: null,
          logo: makeRawImage('Logo'),
          variant: BRAND_VARIANTS.INDIGO,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.variant).toBe(BRAND_VARIANTS.INDIGO);
  });

  it('maps a missing spec line to undefined', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: null,
          logo: makeRawImage('Logo'),
          variant: BRAND_VARIANTS.CONSOLE,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.specLine).toBeUndefined();
  });

  it('joins multiple spec-line items with the mapped separator', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: {
            items: ['build 2026.07', 'online'],
            separator: SPEC_LINE_SEPARATORS.PIPE,
          },
          logo: makeRawImage('Logo'),
          variant: BRAND_VARIANTS.CONSOLE,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.specLine).toBe(
      `build 2026.07 ${SPEC_LINE_SEPARATOR_CHARS.PIPE} online`,
    );
  });

  it('joins spec-line items with the Bullet separator', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: {
            items: ['build 2026.07', 'online'],
            separator: SPEC_LINE_SEPARATORS.BULLET,
          },
          logo: makeRawImage('Logo'),
          variant: BRAND_VARIANTS.CONSOLE,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.specLine).toBe(
      `build 2026.07 ${SPEC_LINE_SEPARATOR_CHARS.BULLET} online`,
    );
  });

  it('joins spec-line items with the Slash separator', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: {
            items: ['build 2026.07', 'online'],
            separator: SPEC_LINE_SEPARATORS.SLASH,
          },
          logo: makeRawImage('Logo'),
          variant: BRAND_VARIANTS.CONSOLE,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.specLine).toBe(
      `build 2026.07 ${SPEC_LINE_SEPARATOR_CHARS.SLASH} online`,
    );
  });

  it('joins a single spec-line item with no separator character', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: { items: ['online'], separator: SPEC_LINE_SEPARATORS.DOT },
          logo: makeRawImage('Logo'),
          variant: BRAND_VARIANTS.CONSOLE,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.specLine).toBe('online');
  });

  it('maps an empty spec-line items list to undefined', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: { items: [], separator: SPEC_LINE_SEPARATORS.DOT },
          logo: makeRawImage('Logo'),
          variant: BRAND_VARIANTS.CONSOLE,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.specLine).toBeUndefined();
  });

  it('maps the default OG image to a URL', async () => {
    mockRun.mockResolvedValue(makeRawSiteSettings());

    const result = await getSiteSettings(tenant);

    expect(result.defaultOgImageUrl).toContain('sanity.io');
  });

  it('leaves logoUrl undefined when no logo is uploaded (D7 fallback)', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: null,
          logo: null,
          variant: BRAND_VARIANTS.CONSOLE,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.logoUrl).toBeUndefined();
  });

  it('exposes the raw logo asset reference alongside the built logoUrl', async () => {
    const logo = makeRawImage('Logo');
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: null,
          logo,
          variant: BRAND_VARIANTS.CONSOLE,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.logoAsset).toEqual(logo);
    expect(result.brand.logoUrl).toBeDefined();
  });

  it('leaves logoAsset undefined when no logo is uploaded', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: null,
          logo: null,
          variant: BRAND_VARIANTS.CONSOLE,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.logoAsset).toBeUndefined();
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
