import type { TAuthorDetail, TPostCardAuthor } from '@blog/service';
import { en, Faker } from '@faker-js/faker';

// A private, seeded Faker instance keeps this value stable across runs
// without touching the global `faker` singleton other suites rely on.
const fixtureFaker = new Faker({ locale: [en] });
fixtureFaker.seed(123);
export const AUTHOR_IMAGE_URL = fixtureFaker.image.avatarGitHub();

export function makeAuthor(
  overrides: Partial<TAuthorDetail> = {},
): TAuthorDetail {
  return {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    role: 'Senior Engineer',
    imageUrl: AUTHOR_IMAGE_URL,
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
