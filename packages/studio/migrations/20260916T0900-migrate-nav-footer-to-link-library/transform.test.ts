import { LINK_LABEL_MAX_LENGTH } from '../lib/link-label-max-length';

import {
  buildLinkRef,
  buildSocialProfile,
  hasMissingLabel,
  hasOversizedLabel,
  hasRecognizedLinkShape,
  hasResolvableUrl,
} from './transform';

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
