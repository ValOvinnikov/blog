import { q } from '@blog/service/sanity/query';
import {
  makeRawExternalLinkDocument,
  makeRawPortableTextMarkDef,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

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

  it('parses a profilePage through the shared link document fragment', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: makeRawExternalLinkDocument({
        url: 'https://example.com/jane',
      }),
    };

    expect(authorCardDocQuery.parse(raw)?.profilePage).toEqual(
      makeRawExternalLinkDocument({ url: 'https://example.com/jane' }),
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

  it('keeps a bio linkRef mark through a real parse', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: null,
      role: null,
      bio: [
        {
          _type: 'block',
          _key: 'bio-block-1',
          markDefs: [makeRawPortableTextMarkDef()],
        },
      ],
      socialLinks: null,
    };

    expect(() => authorDetailDocQuery.parse(raw)).not.toThrow();
    expect(authorDetailDocQuery.parse(raw)?.bio?.[0]).toMatchObject({
      markDefs: [{ link: { url: 'https://example.com' } }],
    });
  });

  it('parses socialLinks through the shared social profile fragment', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: null,
      role: null,
      bio: null,
      socialLinks: [
        {
          platform: 'GITHUB',
          link: makeRawExternalLinkDocument({
            url: 'https://github.com/janedoe',
          }),
        },
      ],
    };

    expect(() => authorDetailDocQuery.parse(raw)).not.toThrow();
    expect(authorDetailDocQuery.parse(raw)?.socialLinks).toEqual([
      {
        platform: 'GITHUB',
        link: makeRawExternalLinkDocument({
          url: 'https://github.com/janedoe',
        }),
      },
    ]);
  });
});
