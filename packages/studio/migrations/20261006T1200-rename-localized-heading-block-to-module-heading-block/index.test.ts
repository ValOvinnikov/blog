import { at, set } from 'sanity/migrate';

import { renameModuleHeadingBlockType } from './index';

describe(renameModuleHeadingBlockType, () => {
  it('renames a localizedHeadingBlock to moduleHeadingBlock', () => {
    const result = renameModuleHeadingBlockType({
      _type: 'localizedHeadingBlock',
      heading: [],
    });

    expect(result).toEqual(at('_type', set('moduleHeadingBlock')));
  });

  it.each(['moduleHeadingBlock', 'headingBlock'])(
    'leaves a %s alone',
    (type) => {
      const result = renameModuleHeadingBlockType({ _type: type });

      expect(result).toBeUndefined();
    },
  );
});
