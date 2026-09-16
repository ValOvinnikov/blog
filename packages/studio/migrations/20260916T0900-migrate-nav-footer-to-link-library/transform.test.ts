import {
  buildLinkDocumentFields,
  buildLinkRef,
  buildSocialProfile,
  hasMissingLabel,
  hasOversizedLabel,
  hasRecognizedLinkShape,
  hasResolvableUrl,
  LINK_LABEL_MAX_LENGTH,
} from './transform';

describe(buildLinkDocumentFields, () => {
  it('carries label/linkType/openInNewTab and the internalReference for an internal link', () => {
    const fields = buildLinkDocumentFields('link-abc123', 'Link to Blog', {
      label: 'Blog',
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page_postIndex' },
      openInNewTab: false,
    });

    expect(fields).toEqual({
      _id: 'link-abc123',
      _type: 'link',
      title: 'Link to Blog',
      label: 'Blog',
      linkType: 'INTERNAL',
      openInNewTab: false,
      internalReference: { _type: 'reference', _ref: 'page_postIndex' },
    });
  });

  it('carries url instead of internalReference for an external link', () => {
    const fields = buildLinkDocumentFields(
      'link-def456',
      'Link to https://www.linkedin.com/in/val-ovinnikov',
      {
        label: 'Linkedin',
        linkType: 'EXTERNAL',
        url: 'https://www.linkedin.com/in/val-ovinnikov',
        openInNewTab: true,
      },
    );

    expect(fields).toEqual({
      _id: 'link-def456',
      _type: 'link',
      title: 'Link to https://www.linkedin.com/in/val-ovinnikov',
      label: 'Linkedin',
      linkType: 'EXTERNAL',
      openInNewTab: true,
      url: 'https://www.linkedin.com/in/val-ovinnikov',
    });
  });

  it('drops platform and accessibleLabel — link has no field for either', () => {
    const fields = buildLinkDocumentFields('link-ghi789', 'Link to Linkedin', {
      label: 'Linkedin',
      accessibleLabel: 'Linkedin profile',
      linkType: 'EXTERNAL',
      url: 'https://www.linkedin.com/in/val-ovinnikov',
      platform: 'LINKEDIN',
    });

    expect(fields).not.toHaveProperty('platform');
    expect(fields).not.toHaveProperty('accessibleLabel');
  });
});

describe(buildLinkRef, () => {
  it('preserves the original _key and points at the given link id', () => {
    const item = { _key: 'nav-1', label: 'Blog', linkType: 'INTERNAL' };

    expect(buildLinkRef(item, 'link-abc123')).toEqual({
      _key: 'nav-1',
      _type: 'linkRef',
      link: { _type: 'reference', _ref: 'link-abc123' },
    });
  });
});

describe(buildSocialProfile, () => {
  it('preserves the original _key and platform, referencing the link id', () => {
    const item = {
      _key: 'social-1',
      label: 'Linkedin',
      linkType: 'EXTERNAL',
      platform: 'LINKEDIN',
    };

    expect(buildSocialProfile(item, 'link-def456')).toEqual({
      _key: 'social-1',
      _type: 'socialProfile',
      platform: 'LINKEDIN',
      link: { _type: 'reference', _ref: 'link-def456' },
    });
  });
});

describe(hasMissingLabel, () => {
  it('is true for an absent label', () => {
    expect(hasMissingLabel({})).toBe(true);
  });

  it('is true for a whitespace-only label', () => {
    expect(hasMissingLabel({ label: '   ' })).toBe(true);
  });

  it('is false for a real label', () => {
    expect(hasMissingLabel({ label: 'Blog' })).toBe(false);
  });
});

describe(hasOversizedLabel, () => {
  it('is false for a label at the limit', () => {
    expect(
      hasOversizedLabel({ label: 'x'.repeat(LINK_LABEL_MAX_LENGTH) }),
    ).toBe(false);
  });

  it('is true for a label over the limit', () => {
    expect(
      hasOversizedLabel({ label: 'x'.repeat(LINK_LABEL_MAX_LENGTH + 1) }),
    ).toBe(true);
  });

  it('is false for a missing label', () => {
    expect(hasOversizedLabel({})).toBe(false);
  });
});

describe(hasRecognizedLinkShape, () => {
  it('accepts the pre-rename "link" _type', () => {
    expect(hasRecognizedLinkShape({ _type: 'link' })).toBe(true);
  });

  it('accepts the post-rename "inlineLink" _type', () => {
    expect(hasRecognizedLinkShape({ _type: 'inlineLink' })).toBe(true);
  });

  it('accepts an entry with no _type at all', () => {
    expect(hasRecognizedLinkShape({})).toBe(true);
  });

  it('rejects any other _type', () => {
    expect(hasRecognizedLinkShape({ _type: 'linkRef' })).toBe(false);
  });
});

describe(hasResolvableUrl, () => {
  it('is true for an internal link regardless of url', () => {
    expect(hasResolvableUrl({ linkType: 'INTERNAL' })).toBe(true);
  });

  it('is true for a full https:// url with a host', () => {
    expect(
      hasResolvableUrl({
        linkType: 'EXTERNAL',
        url: 'https://example.com/pricing',
      }),
    ).toBe(true);
  });

  it('is false for a relative path', () => {
    expect(hasResolvableUrl({ linkType: 'EXTERNAL', url: '/blog' })).toBe(
      false,
    );
  });

  it('is false for a missing url', () => {
    expect(hasResolvableUrl({ linkType: 'EXTERNAL' })).toBe(false);
  });
});
