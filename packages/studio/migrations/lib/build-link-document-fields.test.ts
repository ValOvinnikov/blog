import { buildLinkDocumentFields } from './build-link-document-fields';

describe(buildLinkDocumentFields, () => {
  it('carries label/linkType/openInNewTab and the internalReference for an internal link', () => {
    const fields = buildLinkDocumentFields('link-abc123', 'Link to Home', {
      label: 'Go home',
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page-home-1' },
      openInNewTab: false,
    });

    expect(fields).toEqual({
      _id: 'link-abc123',
      _type: 'link',
      title: 'Link to Home',
      label: 'Go home',
      linkType: 'INTERNAL',
      openInNewTab: false,
      internalReference: { _type: 'reference', _ref: 'page-home-1' },
    });
  });

  it('carries url instead of internalReference for an external link', () => {
    const fields = buildLinkDocumentFields(
      'link-def456',
      'Link to https://example.com',
      {
        label: 'Visit site',
        linkType: 'EXTERNAL',
        url: 'https://example.com',
        openInNewTab: true,
      },
    );

    expect(fields).toEqual({
      _id: 'link-def456',
      _type: 'link',
      title: 'Link to https://example.com',
      label: 'Visit site',
      linkType: 'EXTERNAL',
      openInNewTab: true,
      url: 'https://example.com',
    });
  });

  it('drops platform and accessibleLabel — link has no field for either', () => {
    const fields = buildLinkDocumentFields('link-ghi789', 'Link to GitHub', {
      label: 'GitHub',
      accessibleLabel: 'Visit our GitHub organization',
      linkType: 'EXTERNAL',
      url: 'https://github.com/example',
      platform: 'GITHUB',
    });

    expect(fields).not.toHaveProperty('platform');
    expect(fields).not.toHaveProperty('accessibleLabel');
  });
});
