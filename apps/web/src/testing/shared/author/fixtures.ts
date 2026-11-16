import type { TPostCardAuthor } from '@shinefold/service';

export const mockPostCardAuthor = (
  overrides: Partial<TPostCardAuthor> = {},
): TPostCardAuthor => {
  return {
    id: 'author-1',
    name: 'Jane Doe',
    profileUrl: '/jane-doe',
    image: undefined,
    ...overrides,
  };
};
