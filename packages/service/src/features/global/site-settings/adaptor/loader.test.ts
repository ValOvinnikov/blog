import { SPEC_LINE_SEPARATOR_CHARS, SPEC_LINE_SEPARATORS } from '@blog/config';
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
        description: 'Great content',
        brand: {
          name: 'Awesome Blog',
          specLine: {
            items: ['build 2026.07', 'online'],
            separator: SPEC_LINE_SEPARATORS.DOT,
          },
          logo: makeRawSanityImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.description).toBe('Great content');
    expect(result.brand.name).toBe('Awesome Blog');
    expect(result.brand.specLine).toBe(
      `build 2026.07 ${SPEC_LINE_SEPARATOR_CHARS.DOT} online`,
    );
  });

  it('maps a missing spec line to undefined', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: null,
          logo: makeRawSanityImage('Logo'),
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
          logo: makeRawSanityImage('Logo'),
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
          logo: makeRawSanityImage('Logo'),
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
          logo: makeRawSanityImage('Logo'),
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
          logo: makeRawSanityImage('Logo'),
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
          logo: makeRawSanityImage('Logo'),
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.specLine).toBeUndefined();
  });

  it('leaves logo undefined when no logo is uploaded', async () => {
    mockRun.mockResolvedValue(
      makeRawSiteSettings({
        brand: {
          name: 'Awesome Blog',
          specLine: null,
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
          specLine: null,
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
