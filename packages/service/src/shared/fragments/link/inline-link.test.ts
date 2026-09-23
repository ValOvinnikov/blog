import { LINK_TYPE } from '@blog/config';
import { q } from '@blog/service/sanity/query';

import { inlineLinkFragment } from './inline-link';

const inlineLinkDocQuery = q.star
  .filterByType('inlineLink')
  .slice(0)
  .project(inlineLinkFragment);

describe('inlineLinkFragment', () => {
  it('keeps the internalReference field through a real parse for a page_post reference', () => {
    const raw = {
      label: 'Read more',
      linkType: LINK_TYPE.INTERNAL,
      url: null,
      internalReference: { _type: 'page_post', slug: 'hello-world' },
      openInNewTab: null,
      platform: null,
      accessibleLabel: null,
    };

    expect(inlineLinkDocQuery.parse(raw)).toEqual(raw);
  });

  it('resolves the blog_topic branch from the topic page referencing it, falling back to the topic own slug', () => {
    expect(inlineLinkDocQuery.query).toContain(
      '_type == "blog_topic" => coalesce(*[_type == "page_topic" && topic._ref == ^._id][0].slug.current, slug.current)',
    );
  });
});
