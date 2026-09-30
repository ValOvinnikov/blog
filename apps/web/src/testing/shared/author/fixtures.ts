import type { TPostCardAuthor } from '@blog/service';

export const makePostCardAuthor = (
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
