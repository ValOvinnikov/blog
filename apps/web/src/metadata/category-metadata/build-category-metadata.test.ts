import { describe, expect, it, vi } from 'vitest';

import { buildCategoryMetadata } from './build-category-metadata';

const { getCategoryPageMock } = vi.hoisted(() => ({
  getCategoryPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      category: { v1: { getCategoryPage: getCategoryPageMock } },
    },
  },
}));

const category = {
  id: 'cat-1',
  title: 'Engineering',
  slug: 'engineering',
  description: 'Posts about building things.',
};

describe('buildCategoryMetadata', () => {
  it('builds metadata from the category title/description, self-canonical to /category/[slug]', async () => {
    getCategoryPageMock.mockResolvedValue({ category, posts: [] });

    const metadata = await buildCategoryMetadata('engineering');

    expect(metadata.title).toBe('Engineering');
    expect(metadata.description).toBe('Posts about building things.');
    expect(metadata.alternates?.canonical).toBe('/category/engineering');
    expect(metadata.openGraph?.title).toBe('Engineering');
    expect(metadata.openGraph?.description).toBe(
      'Posts about building things.',
    );
  });

  it('falls back to the category title as description when none is authored', async () => {
    getCategoryPageMock.mockResolvedValue({
      category: { ...category, description: undefined },
      posts: [],
    });

    const metadata = await buildCategoryMetadata('engineering');

    expect(metadata.description).toBe('Engineering');
  });

  it('returns empty metadata when the category does not exist', async () => {
    getCategoryPageMock.mockResolvedValue(null);

    const metadata = await buildCategoryMetadata('missing');

    expect(metadata).toEqual({});
  });
});
