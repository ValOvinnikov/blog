import { toSharedLinkId } from './id';

describe('toSharedLinkId', () => {
  it('derives an id from the link type, target, and label', () => {
    expect(
      toSharedLinkId('settings_navigation', {
        linkType: 'INTERNAL',
        internalReference: { _ref: 'page_postIndex' },
        label: 'Blog',
      }),
    ).toBe('shared_link-internal-page-postindex-blog');
  });

  it('uses the url as the target for an external link', () => {
    expect(
      toSharedLinkId('settings_footer', {
        linkType: 'EXTERNAL',
        url: 'https://www.linkedin.com/in/val-ovinnikov',
        label: 'Linkedin',
      }),
    ).toBe(
      'shared_link-external-https-www-linkedin-com-in-val-ovinnikov-linkedin',
    );
  });

  it('keeps the drafts. prefix outermost, taken from the containing document', () => {
    expect(
      toSharedLinkId('drafts.settings_footer', {
        linkType: 'EXTERNAL',
        url: 'https://example.com',
        label: 'Example',
      }),
    ).toBe('drafts.shared_link-external-https-example-com-example');
  });

  it('converges two different containing documents pointing at the same destination and label', () => {
    const link = {
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page_postIndex' },
      label: 'Read Latest',
    };

    const fromHero = toSharedLinkId(
      '1dfba15b-e987-4f2f-bd00-43c9de791409',
      link,
    );
    const fromHeroBlog = toSharedLinkId(
      '510fec3b-41d5-423b-9583-89763f5923a9',
      link,
    );

    expect(fromHero).toBe(fromHeroBlog);
  });

  it('diverges for links with the same target but a different label', () => {
    const target = {
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page_postIndex' },
    };

    const asBlog = toSharedLinkId('doc-a', { ...target, label: 'Blog' });
    const asReadLatest = toSharedLinkId('doc-b', {
      ...target,
      label: 'Read Latest',
    });

    expect(asBlog).not.toBe(asReadLatest);
  });
});
