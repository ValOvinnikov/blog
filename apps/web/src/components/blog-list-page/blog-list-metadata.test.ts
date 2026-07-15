import { describe, expect, it, vi } from 'vitest';

import { buildBlogListMetadata } from './blog-list-metadata';

const { getSiteSettingsMock } = vi.hoisted(() => ({
  getSiteSettingsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    global: {
      siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
    },
  },
}));

describe('buildBlogListMetadata', () => {
  it('builds page-1 metadata, self-canonical to /blog', async () => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { description: 'A great blog.' },
    });

    const metadata = await buildBlogListMetadata(1);

    expect(metadata.title).toBe('Blog');
    expect(metadata.description).toBe('A great blog.');
    expect(metadata.alternates?.canonical).toBe('/blog');
  });

  it('builds page-N metadata, self-canonical to /blog/page/N — never /blog', async () => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { description: 'A great blog.' },
    });

    const metadata = await buildBlogListMetadata(2);

    expect(metadata.title).toBe('Blog – Page 2');
    expect(metadata.alternates?.canonical).toBe('/blog/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/blog');
  });
});
