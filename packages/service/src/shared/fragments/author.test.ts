import { q } from '@blog/service/sanity/query';
import { makeRawSanityImage } from '@blog/service/testing/shared/fixtures';

import { authorCardFragment, authorDetailFragment } from './author';

const authorCardDocQuery = q.star
  .filterByType('blog_author')
  .slice(0)
  .project(authorCardFragment);

const authorDetailDocQuery = q.star
  .filterByType('blog_author')
  .slice(0)
  .project(authorDetailFragment);

describe('authorCardFragment', () => {
  it('parses an author with no image, leaving image null', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: null,
    };

    expect(() => authorCardDocQuery.parse(raw)).not.toThrow();
    expect(authorCardDocQuery.parse(raw)?.image).toBeNull();
  });

  it('parses an author with an image present', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: makeRawSanityImage('Jane avatar'),
      profilePage: null,
    };

    expect(authorCardDocQuery.parse(raw)?.image).toEqual(
      makeRawSanityImage('Jane avatar'),
    );
  });
});

describe('authorDetailFragment', () => {
  it('parses an author with no image, leaving image null', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: null,
      role: null,
      bio: null,
      socialLinks: null,
    };

    expect(() => authorDetailDocQuery.parse(raw)).not.toThrow();
    expect(authorDetailDocQuery.parse(raw)?.image).toBeNull();
  });
});
