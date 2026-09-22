import { LINK_TYPE } from '@blog/config';
import { q } from '@blog/service/sanity/query';

import { linkDocumentFragment } from './link-document';

const linkDocQuery = q.star
  .filterByType('link')
  .slice(0)
  .project(linkDocumentFragment)
  .notNull();

describe('linkDocumentFragment', () => {
  it('keeps the url field through a real parse for an EXTERNAL link', () => {
    const raw = {
      label: 'Subscribe',
      linkType: LINK_TYPE.EXTERNAL,
      url: 'https://example.com',
      internalReference: null,
      openInNewTab: null,
    };

    expect(linkDocQuery.parse(raw)).toEqual(raw);
  });

  it('keeps the internalReference field through a real parse for an INTERNAL link', () => {
    const raw = {
      label: 'Subscribe',
      linkType: LINK_TYPE.INTERNAL,
      url: null,
      internalReference: { _type: 'page_post', slug: 'hello-world' },
      openInNewTab: null,
    };

    expect(linkDocQuery.parse(raw)).toEqual(raw);
  });
});
