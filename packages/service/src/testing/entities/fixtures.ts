import type { TRawCategoryWithPostCount } from '@blog/service/features/entities/categories/adaptor/transformer';
import type { TRawAuthor } from '@blog/service/features/pages/author/adaptor/detail-page/transformer';
import type { TRawCategory } from '@blog/service/shared/transformers/to-category';
import type { TRawTag } from '@blog/service/shared/transformers/to-tag';
import { makeRawImage } from '@blog/service/testing/shared/fixtures';

export function makeRawCategory(
  overrides: Partial<TRawCategory> = {},
): TRawCategory {
  return {
    _id: 'cat-1',
    title: 'Engineering',
    slug: 'engineering',
    description: 'Engineering posts',
    ...overrides,
  };
}

export function makeRawCategoryWithPostCount(
  overrides: Partial<TRawCategoryWithPostCount> = {},
): TRawCategoryWithPostCount {
  return {
    ...makeRawCategory(),
    postCount: 0,
    ...overrides,
  };
}

export function makeRawTag(overrides: Partial<TRawTag> = {}): TRawTag {
  return {
    _id: 'tag-1',
    title: 'TypeScript',
    slug: 'typescript',
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
