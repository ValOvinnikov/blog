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

  it('resolves a sharedLinkAnnotation mark inside bio to its shared_link destination', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: null,
      role: null,
      socialLinks: null,
      bio: [
        {
          _type: 'block',
          _key: 'bio-block-1',
          style: 'normal',
          markDefs: [
            {
              _key: 'mark-1',
              _type: 'sharedLinkAnnotation',
              link: {
                label: 'My site',
                linkType: 'EXTERNAL',
                url: 'https://example.com',
                internalReference: null,
                openInNewTab: null,
              },
            },
          ],
          children: [{ _type: 'span', _key: 'span-1', text: 'My site' }],
        },
      ],
    };

    const parsed = authorDetailDocQuery.parse(raw);

    expect(parsed?.bio?.[0]).toMatchObject({
      markDefs: [
        {
          _key: 'mark-1',
          _type: 'sharedLinkAnnotation',
          link: { label: 'My site', url: 'https://example.com' },
        },
      ],
    });
  });
});
