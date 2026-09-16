import { toLinkId, toLinkIdentityKey } from './id';

describe(toLinkIdentityKey, () => {
  it('keys an internal link on the referenced document id and label', () => {
    const key = toLinkIdentityKey({
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page-post-1' },
      label: 'Read more',
    });

    expect(key).toBe('internal:page-post-1|label:Read more');
  });

  it('keys an external link on the url and label', () => {
    const key = toLinkIdentityKey({
      linkType: 'EXTERNAL',
      url: 'https://example.com/pricing',
      label: 'Pricing',
    });

    expect(key).toBe('external:https://example.com/pricing|label:Pricing');
  });

  it('produces different ids for the same destination with different labels', () => {
    const a = toLinkIdentityKey({
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page-post-1' },
      label: 'Blog',
    });
    const b = toLinkIdentityKey({
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page-post-1' },
      label: 'Read Latest',
    });

    expect(a).not.toBe(b);
    expect(toLinkId(a as string)).not.toBe(toLinkId(b as string));
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
    expect(toLinkId('internal:page-post-1|label:Blog')).toBe(
      toLinkId('internal:page-post-1|label:Blog'),
    );
  });

  it('differs for different identity keys', () => {
    expect(toLinkId('internal:page-post-1|label:Blog')).not.toBe(
      toLinkId('internal:page-post-2|label:Blog'),
    );
  });

  it('is prefixed and uses only id-safe characters', () => {
    const id = toLinkId('external:https://example.com/a?b=c#d|label:A link');

    expect(id).toMatch(/^link-[a-f0-9]{16}$/);
  });
});
