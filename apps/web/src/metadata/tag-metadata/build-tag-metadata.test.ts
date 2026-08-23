import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { makeTagDetailPage } from '@web/testing/shared/tag/fixtures';

import { buildTagMetadata } from './build-tag-metadata';

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tag: { v1: { getTagPage: getTagPageMock } },
    },
  },
}));

const seo = makeSeo({
  title: 'TypeScript',
  description: 'Posts about TypeScript.',
  ogTitle: 'TypeScript',
  ogDescription: 'Posts about TypeScript.',
  ogImageUrl: 'https://cdn.example.com/og.jpg',
});

describe('buildTagMetadata', () => {
  it('builds page-1 metadata from the resolved seo, self-canonical to /tags/[slug]', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage({ seo }),
    });

    const metadata = await buildTagMetadata('typescript');

    expect(metadata.title).toBe('TypeScript');
    expect(metadata.description).toBe('Posts about TypeScript.');
    expect(metadata.alternates?.canonical).toBe('/tags/typescript');
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/tags/typescript/rss.xml',
    });
    expect(metadata.openGraph?.title).toBe('TypeScript');
    expect(metadata.openGraph?.description).toBe('Posts about TypeScript.');
    expect(getTagPageMock).toHaveBeenCalledWith('typescript');
  });

  it('returns empty metadata when the tag fetch fails', async () => {
    getTagPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTagMetadata('typescript');

    expect(metadata).toEqual({});
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /tags/[slug]/page/N — never /tags/[slug]', async () => {
    getTagPageMock.mockResolvedValue({
      ok: true,
      data: makeTagDetailPage({ seo }),
    });

    const metadata = await buildTagMetadata('typescript', 2);

    expect(metadata.title).toBe('TypeScript – Page 2');
    expect(metadata.openGraph?.title).toBe('TypeScript – Page 2');
    expect(metadata.alternates?.canonical).toBe('/tags/typescript/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/tags/typescript');
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/tags/typescript/rss.xml',
    });
    expect(getTagPageMock).toHaveBeenCalledWith('typescript');
  });

  it('returns empty metadata for page N when the tag fetch fails', async () => {
    getTagPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTagMetadata('missing', 2);

    expect(metadata).toEqual({});
  });
});
