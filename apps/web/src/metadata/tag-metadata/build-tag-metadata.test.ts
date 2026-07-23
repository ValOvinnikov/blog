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

const tag = {
  id: 'tag-1',
  title: 'TypeScript',
  slug: 'typescript',
  description: 'Posts about TypeScript.',
  seo: {
    title: 'TypeScript',
    description: 'Posts about TypeScript.',
    ogTitle: 'TypeScript',
    ogDescription: 'Posts about TypeScript.',
    ogImageUrl: 'https://cdn.example.com/og.jpg',
  },
};

describe('buildTagMetadata', () => {
  it('builds metadata from the tag resolved seo, self-canonical to /tag/[slug]', async () => {
    getTagPageMock.mockResolvedValue({
      tag,
      posts: [],
      currentPage: 1,
      totalPages: 1,
      total: 0,
    });

    const metadata = await buildTagMetadata('typescript');

    expect(metadata.title).toBe('TypeScript');
    expect(metadata.description).toBe('Posts about TypeScript.');
    expect(metadata.alternates?.canonical).toBe('/tag/typescript');
    expect(metadata.openGraph?.title).toBe('TypeScript');
    expect(metadata.openGraph?.description).toBe('Posts about TypeScript.');
    expect(getTagPageMock).toHaveBeenCalledWith('typescript', {
      page: undefined,
      itemsPerPage: 9,
    });
  });

  it('returns empty metadata when the tag does not exist', async () => {
    getTagPageMock.mockResolvedValue(null);

    const metadata = await buildTagMetadata('missing');

    expect(metadata).toEqual({});
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /tag/[slug]/page/N — never /tag/[slug]', async () => {
    getTagPageMock.mockResolvedValue({
      tag,
      posts: [],
      currentPage: 2,
      totalPages: 3,
      total: 20,
    });

    const metadata = await buildTagMetadata('typescript', 2);

    expect(metadata.title).toBe('TypeScript – Page 2');
    expect(metadata.openGraph?.title).toBe('TypeScript – Page 2');
    expect(metadata.alternates?.canonical).toBe('/tag/typescript/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/tag/typescript');
    expect(getTagPageMock).toHaveBeenCalledWith('typescript', {
      page: 2,
      itemsPerPage: 9,
    });
  });

  it('returns empty metadata for page N when the tag does not exist', async () => {
    getTagPageMock.mockResolvedValue(null);

    const metadata = await buildTagMetadata('missing', 2);

    expect(metadata).toEqual({});
  });
});
