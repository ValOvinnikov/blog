import { isBodyArrayItemPath, renameBodyImageType } from './transform';

describe(isBodyArrayItemPath, () => {
  it('is true for a keyed element directly under body', () => {
    expect(isBodyArrayItemPath(['body', { _key: 'a1' }])).toBe(true);
  });

  it('is false for the non-array heroImage field', () => {
    expect(isBodyArrayItemPath(['heroImage'])).toBe(false);
  });

  it('is false for a path nested deeper than the array member itself', () => {
    expect(isBodyArrayItemPath(['body', { _key: 'a1' }, 'asset'])).toBe(false);
  });

  it('is false for an array element under a field named something else', () => {
    expect(isBodyArrayItemPath(['gallery', { _key: 'a1' }])).toBe(false);
  });

  it('is false for a non-keyed body path segment', () => {
    expect(isBodyArrayItemPath(['body', 0])).toBe(false);
  });
});

describe(renameBodyImageType, () => {
  it('renames a legacy imageWithAlt body array item to bodyImage, preserving other fields', () => {
    const node = {
      _type: 'imageWithAlt',
      _key: 'a1',
      asset: { _type: 'reference', _ref: 'image-abc' },
      hotspot: {
        _type: 'sanity.imageHotspot',
        x: 0.5,
        y: 0.5,
        height: 1,
        width: 1,
      },
      crop: { _type: 'sanity.imageCrop', top: 0, bottom: 0, left: 0, right: 0 },
      alt: 'A description',
    };

    const result = renameBodyImageType(node, ['body', { _key: 'a1' }]);

    expect(result).toEqual({ ...node, _type: 'bodyImage' });
  });

  it('is idempotent — a node already renamed to bodyImage is left alone', () => {
    const node = { _type: 'bodyImage', _key: 'a1', alt: 'Already migrated' };

    const result = renameBodyImageType(node, ['body', { _key: 'a1' }]);

    expect(result).toBeUndefined();
  });

  it('never touches an imageWithAlt node outside a body[] array (e.g. heroImage)', () => {
    const node = { _type: 'imageWithAlt', alt: 'Hero' };

    const result = renameBodyImageType(node, ['heroImage']);

    expect(result).toBeUndefined();
  });

  it('leaves unrelated object types under body[] alone', () => {
    const node = { _type: 'aside', _key: 'a1' };

    const result = renameBodyImageType(node, ['body', { _key: 'a1' }]);

    expect(result).toBeUndefined();
  });
});
