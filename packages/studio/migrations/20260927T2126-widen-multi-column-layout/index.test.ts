import { CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config/constants';
import { set } from 'sanity/migrate';

import migration from './index';

const objectHandler = migration.migrate.object;

if (!objectHandler) {
  throw new Error('Expected the migration to define an object() node handler.');
}

describe('widen-multi-column-layout', () => {
  it('retypes the layout field to wideLayout', () => {
    const node = {
      _type: 'layout',
      spacingTop: SPACING_SCALE.MD,
      containerWidth: CONTAINER_WIDTH.WIDE,
    };

    const result = objectHandler(node, ['layout']);

    expect(result).toEqual(set({ ...node, _type: 'wideLayout' }));
  });
});
