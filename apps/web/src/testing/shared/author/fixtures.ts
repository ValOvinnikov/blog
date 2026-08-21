import type { TAuthorDetail, TPostCardAuthor } from '@blog/service';
import { en, Faker } from '@faker-js/faker';

// A private, seeded Faker instance keeps this value stable across runs
// without touching the global `faker` singleton other suites rely on.
const fixtureFaker = new Faker({ locale: [en] });
fixtureFaker.seed(123);
export const AUTHOR_IMAGE_URL = `${fixtureFaker.image.avatarGitHub()}?w=112&h=112&fit=crop&q=75`;
export const AUTHOR_OG_IMAGE_URL = fixtureFaker.image.avatar();

export const makeAuthor = (
  overrides: Partial<TAuthorDetail> = {},
): TAuthorDetail => {
  return {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    role: 'Senior Engineer',
    imageUrl: AUTHOR_IMAGE_URL,
    ogImageUrl: AUTHOR_OG_IMAGE_URL,
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
};

export const makePostCardAuthor = (
  overrides: Partial<TPostCardAuthor> = {},
): TPostCardAuthor => {
  return {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    imageUrl: undefined,
    ...overrides,
  };
};
