import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { renamePageHeadingBlockType } from './index';

faker.seed(10150);

describe(renamePageHeadingBlockType, () => {
  it('renames a headingBlock to pageHeadingBlock', () => {
    const result = renamePageHeadingBlockType({
      _type: 'headingBlock',
      heading: faker.lorem.words(2),
    });

    expect(result).toEqual(at('_type', set('pageHeadingBlock')));
  });

  it.each(['pageHeadingBlock', 'moduleHeadingBlock'])(
    'leaves a %s alone',
    (type) => {
      const result = renamePageHeadingBlockType({ _type: type });

      expect(result).toBeUndefined();
    },
  );
});
