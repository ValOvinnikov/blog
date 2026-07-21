import { describe, expect, it, vi } from 'vitest';

import { buildAuthorMetadata } from './build-author-metadata';

const { getAuthorMock } = vi.hoisted(() => ({
  getAuthorMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      author: { v1: { getAuthor: getAuthorMock } },
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
    getAuthorMock.mockResolvedValue(author);

    const metadata = await buildAuthorMetadata('jane-doe');

    expect(metadata.title).toBe('Jane Doe — Senior Engineer');
    expect(metadata.description).toBe('Builds things.');
    expect(metadata.alternates?.canonical).toBe('/author/jane-doe');
    expect(metadata.openGraph?.title).toBe('Jane Doe — Senior Engineer');
    expect(metadata.openGraph?.description).toBe('Builds things.');
  });

  it('falls back to the plain name when no role is authored', async () => {
    getAuthorMock.mockResolvedValue({ ...author, role: undefined });

    const metadata = await buildAuthorMetadata('jane-doe');

    expect(metadata.title).toBe('Jane Doe');
  });

  it('falls back to the title as description when no bio is authored', async () => {
    getAuthorMock.mockResolvedValue({ ...author, bio: undefined });

    const metadata = await buildAuthorMetadata('jane-doe');

    expect(metadata.description).toBe('Jane Doe — Senior Engineer');
  });

  it('returns empty metadata when the author does not exist', async () => {
    getAuthorMock.mockResolvedValue(null);

    const metadata = await buildAuthorMetadata('missing');

    expect(metadata).toEqual({});
  });
});
