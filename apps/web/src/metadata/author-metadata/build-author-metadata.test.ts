import { buildAuthorMetadata } from './build-author-metadata';

const { getAuthorPageMock } = vi.hoisted(() => ({
  getAuthorPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      author: { v1: { getAuthorPage: getAuthorPageMock } },
    },
  },
}));

const author = {
  id: 'author-1',
  name: 'Jane Doe',
  slug: 'jane-doe',
  role: 'Senior Engineer',
  imageUrl: 'https://cdn.example.com/jane.jpg',
  bio: [
    {
      _type: 'block' as const,
      _key: 'b1',
      children: [
        { _type: 'span' as const, _key: 's1', text: 'Builds things.' },
      ],
    },
  ],
  socialLinks: [],
};

describe('buildAuthorMetadata', () => {
  it('builds metadata from the author name/role/bio, self-canonical to /author/[slug]', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    const metadata = await buildAuthorMetadata('jane-doe');

    expect(metadata.title).toBe('Jane Doe — Senior Engineer');
    expect(metadata.description).toBe('Builds things.');
    expect(metadata.alternates?.canonical).toBe('/author/jane-doe');
    expect(metadata.openGraph?.title).toBe('Jane Doe — Senior Engineer');
    expect(metadata.openGraph?.description).toBe('Builds things.');
    expect(getAuthorPageMock).toHaveBeenCalledWith('jane-doe', {
      page: undefined,
      itemsPerPage: 9,
    });
  });

  it('falls back to the plain name when no role is authored', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author: { ...author, role: undefined },
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    const metadata = await buildAuthorMetadata('jane-doe');

    expect(metadata.title).toBe('Jane Doe');
  });

  it('falls back to the title as description when no bio is authored', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author: { ...author, bio: undefined },
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    const metadata = await buildAuthorMetadata('jane-doe');

    expect(metadata.description).toBe('Jane Doe — Senior Engineer');
  });

  it('returns empty metadata when the author does not exist', async () => {
    getAuthorPageMock.mockResolvedValue({ ok: true, data: null });

    const metadata = await buildAuthorMetadata('missing');

    expect(metadata).toEqual({});
  });

  it('returns empty metadata when the author fetch fails', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildAuthorMetadata('jane-doe');

    expect(metadata).toEqual({});
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /author/[slug]/page/N — never /author/[slug]', async () => {
    getAuthorPageMock.mockResolvedValue({
      ok: true,
      data: {
        author,
        posts: [],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });

    const metadata = await buildAuthorMetadata('jane-doe', 2);

    expect(metadata.title).toBe('Jane Doe — Senior Engineer – Page 2');
    expect(metadata.openGraph?.title).toBe(
      'Jane Doe — Senior Engineer – Page 2',
    );
    expect(metadata.alternates?.canonical).toBe('/author/jane-doe/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/author/jane-doe');
    expect(getAuthorPageMock).toHaveBeenCalledWith('jane-doe', {
      page: 2,
      itemsPerPage: 9,
    });
  });

  it('returns empty metadata for page N when the author does not exist', async () => {
    getAuthorPageMock.mockResolvedValue({ ok: true, data: null });

    const metadata = await buildAuthorMetadata('missing', 2);

    expect(metadata).toEqual({});
  });
});
