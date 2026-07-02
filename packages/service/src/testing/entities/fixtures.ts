import type { TRawAuthor } from '#/features/entities/author/adaptor/detail/transformer';
import type { TRawCategory } from '#/shared/transformers/to-category';
import { makeRawImage } from '#/testing/shared/fixtures';

export function makeRawCategory(
  overrides: Partial<TRawCategory> = {}
): TRawCategory {
  return {
    _id: 'cat-1',
    title: 'Engineering',
    slug: 'engineering',
    description: 'Engineering posts',
    ...overrides,
  };
}

export function makeRawAuthor(overrides: Partial<TRawAuthor> = {}): TRawAuthor {
  return {
    _id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    image: makeRawImage('Jane avatar'),
    role: 'Writer',
    bio: null,
    socialLinks: null,
    ...overrides,
  };
}

export { makeRawImage };
