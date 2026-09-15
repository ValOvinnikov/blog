import { toLinkId, toLinkIdentityKey } from './id';

describe(toLinkIdentityKey, () => {
  it('keys an internal link on the referenced document id', () => {
    const key = toLinkIdentityKey({
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page-post-1' },
    });

    expect(key).toBe('internal:page-post-1');
  });

  it('keys an external link on the url', () => {
    const key = toLinkIdentityKey({
      linkType: 'EXTERNAL',
      url: 'https://example.com/pricing',
    });

    expect(key).toBe('external:https://example.com/pricing');
  });

  it('never keys on label — two links can share a label and point elsewhere', () => {
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
