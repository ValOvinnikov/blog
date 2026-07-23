import type { TAuthorDetail, TPostCardAuthor } from '@blog/service';

export function makeAuthor(
  overrides: Partial<TAuthorDetail> = {},
): TAuthorDetail {
  return {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    role: 'Senior Engineer',
    imageUrl: 'https://cdn.example.com/jane.jpg',
    bio: [
      {
        _type: 'block',
        _key: 'b1',
        children: [{ _type: 'span', _key: 's1', text: 'Builds things.' }],
      },
    ],
    socialLinks: [],
    ...overrides,
  };
}

export function makePostCardAuthor(
  overrides: Partial<TPostCardAuthor> = {},
): TPostCardAuthor {
  return {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    imageUrl: undefined,
    ...overrides,
  };
}
