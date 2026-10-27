import { faker } from '@faker-js/faker';

import { isBodyArrayItemPath, renameBodyImageType } from './transform';

faker.seed(5);

const MOCK_KEY = faker.string.alphanumeric(6);
const MOCK_ALT = faker.lorem.words();
const MOCK_ASSET_REF = faker.string.uuid();

const BODY_ITEM_PATH = ['body', { _key: MOCK_KEY }];

describe(isBodyArrayItemPath, () => {
  it('is true for a keyed element directly under body', () => {
    expect(isBodyArrayItemPath(BODY_ITEM_PATH)).toBe(true);
  });

  it.each([
    ['a non-array field', ['heroImage']],
    ['a path nested deeper than the member', [...BODY_ITEM_PATH, 'asset']],
    ['an array under another field', ['gallery', { _key: MOCK_KEY }]],
    ['a non-keyed body segment', ['body', 0]],
  ])('is false for %s', (_label, path) => {
    expect(isBodyArrayItemPath(path)).toBe(false);
  });
});

describe(renameBodyImageType, () => {
  it('renames a legacy body image to bodyImage, keeping other fields', () => {
    const node = {
      _type: 'imageWithAlt',
      _key: MOCK_KEY,
      asset: { _type: 'reference', _ref: MOCK_ASSET_REF },
      alt: MOCK_ALT,
    };

    const result = renameBodyImageType(node, BODY_ITEM_PATH);

    expect(result).toEqual({ ...node, _type: 'bodyImage' });
  });

  it.each([
    ['a node already renamed', { _type: 'bodyImage' }, BODY_ITEM_PATH],
    ['an unrelated object type', { _type: 'aside' }, BODY_ITEM_PATH],
    [
      'an image outside the body array',
      { _type: 'imageWithAlt' },
      ['heroImage'],
    ],
  ])('leaves %s alone', (_label, node, path) => {
    const result = renameBodyImageType(node, path);

    expect(result).toBeUndefined();
  });
});
