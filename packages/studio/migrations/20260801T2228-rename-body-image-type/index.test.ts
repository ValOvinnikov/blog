import { faker } from '@faker-js/faker';
import { set } from 'sanity/migrate';

import migration from './index';

faker.seed(4);

const MOCK_KEY = faker.string.alphanumeric(6);
const MOCK_ALT = faker.lorem.words();

const objectHandler = migration.migrate.object;

if (!objectHandler) {
  throw new Error('Expected the migration to define an object() node handler.');
}

describe('rename-body-image-type migration', () => {
  it('renames a legacy body image array item', () => {
    const node = { _type: 'imageWithAlt', _key: MOCK_KEY, alt: MOCK_ALT };

    const result = objectHandler(node, ['body', { _key: MOCK_KEY }]);

    expect(result).toEqual(set({ ...node, _type: 'bodyImage' }));
  });

  it('leaves a node outside the body array alone', () => {
    const node = { _type: 'imageWithAlt', alt: MOCK_ALT };

    const result = objectHandler(node, ['heroImage']);

    expect(result).toBeUndefined();
  });
});
