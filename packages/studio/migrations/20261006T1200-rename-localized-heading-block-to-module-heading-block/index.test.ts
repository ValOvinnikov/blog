import { at, set } from 'sanity/migrate';

import { renameModuleHeadingBlockType } from './index';

describe(renameModuleHeadingBlockType, () => {
  it('renames a localizedHeadingBlock to moduleHeadingBlock', () => {
    expect(
      renameModuleHeadingBlockType({
        _type: 'localizedHeadingBlock',
        heading: [],
      }),
    ).toEqual(at('_type', set('moduleHeadingBlock')));
  });

  it('is idempotent — a moduleHeadingBlock is left alone', () => {
    expect(
      renameModuleHeadingBlockType({ _type: 'moduleHeadingBlock' }),
    ).toBeUndefined();
  });

  it('leaves every other object alone', () => {
    expect(
      renameModuleHeadingBlockType({ _type: 'headingBlock' }),
    ).toBeUndefined();
  });
});
