import type { TCategory, TCategoryWithPostCount } from '@blog/service';

export function makeCategory(overrides: Partial<TCategory> = {}): TCategory {
  return {
    id: 'cat-1',
    title: 'Engineering',
    slug: 'engineering',
    description: 'Posts about building things.',
    ...overrides,
  };
}

export function makeCategoryWithPostCount(
  overrides: Partial<TCategoryWithPostCount> = {},
): TCategoryWithPostCount {
  return {
    ...makeCategory(),
    postCount: 0,
    ...overrides,
  };
}
