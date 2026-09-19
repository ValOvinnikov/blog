import { toLinkId, toLinkIdentityKey } from './link-identity';

describe(toLinkIdentityKey, () => {
  it('keys an internal link on the referenced document id and label', () => {
    const key = toLinkIdentityKey({
      linkType: 'INTERNAL',
      label: 'Blog',
      internalReference: { _ref: 'page-post-1' },
    });

    expect(key).toBe('internal:page-post-1|label:Blog');
  });

  it('keys an external link on the url and label', () => {
    const key = toLinkIdentityKey({
      linkType: 'EXTERNAL',
      label: 'Pricing',
      url: 'https://example.com/pricing',
    });

    expect(key).toBe('external:https://example.com/pricing|label:Pricing');
  });

  it('keys two links with the same label but different destinations differently', () => {
    const a = toLinkIdentityKey({
      linkType: 'EXTERNAL',
      label: 'Learn more',
      url: 'https://example.com/a',
    });
    const b = toLinkIdentityKey({
      linkType: 'EXTERNAL',
      label: 'Learn more',
      url: 'https://example.com/b',
    });

    expect(a).not.toBe(b);
  });

  it('keys two links with the same destination but different labels differently', () => {
    const a = toLinkIdentityKey({
      linkType: 'INTERNAL',
      label: 'Blog',
      internalReference: { _ref: 'page-post-1' },
    });
    const b = toLinkIdentityKey({
      linkType: 'INTERNAL',
      label: 'Read Latest',
      internalReference: { _ref: 'page-post-1' },
    });

    expect(a).not.toBe(b);
    expect(toLinkId(a as string)).not.toBe(toLinkId(b as string));
  });

  it('keys two links with the same destination and label the same, for dedup', () => {
    const a = toLinkIdentityKey({
      linkType: 'INTERNAL',
      label: 'Blog',
      internalReference: { _ref: 'page-post-1' },
    });
    const b = toLinkIdentityKey({
      linkType: 'INTERNAL',
      label: 'Blog',
      internalReference: { _ref: 'page-post-1' },
    });

    expect(a).toBe(b);
  });

  it('treats a missing label as the empty string, distinct from an explicit one', () => {
    const withoutLabel = toLinkIdentityKey({
      linkType: 'EXTERNAL',
      url: 'https://example.com/a',
    });
    const withLabel = toLinkIdentityKey({
      linkType: 'EXTERNAL',
      url: 'https://example.com/a',
      label: '',
    });

    expect(withoutLabel).toBe('external:https://example.com/a|label:');
    expect(withoutLabel).toBe(withLabel);
  });

  it('is undefined for an internal link with no internalReference set', () => {
    expect(toLinkIdentityKey({ linkType: 'INTERNAL' })).toBeUndefined();
  });

  it('is undefined for an external link with no url set', () => {
    expect(toLinkIdentityKey({ linkType: 'EXTERNAL' })).toBeUndefined();
  });

  it('is undefined when linkType itself is missing', () => {
    expect(toLinkIdentityKey({ url: 'https://example.com' })).toBeUndefined();
  });
});

describe(toLinkId, () => {
  it('is deterministic for the same identity key', () => {
    expect(toLinkId('internal:page-post-1')).toBe(
      toLinkId('internal:page-post-1'),
    );
  });

  it('differs for different identity keys', () => {
    expect(toLinkId('internal:page-post-1')).not.toBe(
      toLinkId('internal:page-post-2'),
    );
  });

  it('is prefixed and uses only id-safe characters', () => {
    const id = toLinkId('external:https://example.com/a?b=c#d');

    expect(id).toMatch(/^link-[a-f0-9]{16}$/);
  });
});
