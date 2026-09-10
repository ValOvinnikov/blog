import { mockLandingPage } from '@web/testing/pages/landing-page/fixtures';

import { buildLandingPageMetadata } from './build-landing-page-metadata';

const { getLandingPageMock } = vi.hoisted(() => ({
  getLandingPageMock: vi.fn(),
}));

vi.mock('@web/server/landing/get-landing-page', () => ({
  getLandingPage: getLandingPageMock,
}));

describe('buildLandingPageMetadata', () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
  });

  it('forwards the slug and tenant to getLandingPage — the same cached loader LandingPage reads', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    await buildLandingPageMetadata('about-us', 'tenant-1');

    expect(getLandingPageMock).toHaveBeenCalledWith('about-us', 'tenant-1');
  });

  it('maps the resolved seo straight through toMetadata, self-canonical to /[slug]', async () => {
    getLandingPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });

    const metadata = await buildLandingPageMetadata('about-us', 'tenant-1');

    expect(metadata.title).toBe('About Us');
    expect(metadata.description).toBe('Who we are.');
    expect(metadata.alternates?.canonical).toBe('/about-us');
    expect(metadata.openGraph?.title).toBe('About Us OG');
    expect(metadata.openGraph?.description).toBe('Who we are OG.');
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/about-og.jpg' },
    ]);
  });

  it('returns empty metadata and logs when the page fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getLandingPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildLandingPageMetadata('missing', 'tenant-1');

    expect(metadata).toEqual({});
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('landing_page_metadata.fetch_failed'),
    );
    errorSpy.mockRestore();
  });

  it('returns empty metadata without logging when the page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getLandingPageMock.mockResolvedValue({ ok: true, data: undefined });

    const metadata = await buildLandingPageMetadata('missing', 'tenant-1');

    expect(metadata).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
