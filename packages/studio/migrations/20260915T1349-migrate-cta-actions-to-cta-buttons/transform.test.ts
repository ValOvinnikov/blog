import {
  buildCtaButton,
  buildLinkDocumentFields,
  detectOrderingIssues,
  hasMissingLabel,
  hasOversizedLabel,
  LINK_LABEL_MAX_LENGTH,
  type TLegacyCtaAction,
} from './transform';

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

describe(buildCtaButton, () => {
  it('preserves the original _key, variant and appearance', () => {
    const action: TLegacyCtaAction = {
      _key: 'action-1',
      variant: 'PRIMARY',
      appearance: 'CONTAINED',
      link: { linkType: 'EXTERNAL', url: 'https://example.com' },
    };

    expect(buildCtaButton(action, 'link-abc123')).toEqual({
      _key: 'action-1',
      _type: 'ctaButton',
      variant: 'PRIMARY',
      appearance: 'CONTAINED',
      link: { _type: 'reference', _ref: 'link-abc123' },
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
    expect(hasMissingLabel({ label: 'Get started' })).toBe(false);
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

describe(detectOrderingIssues, () => {
  it('reports nothing for a single Primary', () => {
    expect(detectOrderingIssues([{ _key: 'a', variant: 'PRIMARY' }])).toEqual(
      [],
    );
  });

  it('reports nothing for a valid Primary-then-Secondary pair', () => {
    expect(
      detectOrderingIssues([
        { _key: 'a', variant: 'PRIMARY' },
        { _key: 'b', variant: 'SECONDARY' },
      ]),
    ).toEqual([]);
  });

  it('reports nothing for an empty array', () => {
    expect(detectOrderingIssues([])).toEqual([]);
  });

  it('flags a duplicate variant', () => {
    expect(
      detectOrderingIssues([
        { _key: 'a', variant: 'SECONDARY' },
        { _key: 'b', variant: 'SECONDARY' },
      ]),
    ).toEqual([{ type: 'DUPLICATE_VARIANT', variant: 'SECONDARY' }]);
  });

  it('flags a Primary that is not first', () => {
    expect(
      detectOrderingIssues([
        { _key: 'a', variant: 'SECONDARY' },
        { _key: 'b', variant: 'PRIMARY' },
      ]),
    ).toEqual([{ type: 'PRIMARY_NOT_FIRST' }]);
  });

  it('flags more than two buttons', () => {
    const issues = detectOrderingIssues([
      { _key: 'a', variant: 'PRIMARY' },
      { _key: 'b', variant: 'SECONDARY' },
      { _key: 'c' },
    ]);

    expect(issues).toContainEqual({ type: 'TOO_MANY_BUTTONS', count: 3 });
  });

  it('can report multiple issues at once', () => {
    const issues = detectOrderingIssues([
      { _key: 'a', variant: 'SECONDARY' },
      { _key: 'b', variant: 'SECONDARY' },
      { _key: 'c', variant: 'PRIMARY' },
    ]);

    expect(issues).toContainEqual({ type: 'TOO_MANY_BUTTONS', count: 3 });
    expect(issues).toContainEqual({
      type: 'DUPLICATE_VARIANT',
      variant: 'SECONDARY',
    });
    expect(issues).toContainEqual({ type: 'PRIMARY_NOT_FIRST' });
  });
});
