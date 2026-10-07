import { at, set } from 'sanity/migrate';

import { renamePageHeadingBlockType } from './index';

describe(renamePageHeadingBlockType, () => {
  it('renames a headingBlock to pageHeadingBlock', () => {
    expect(
      renamePageHeadingBlockType({ _type: 'headingBlock', heading: 'Home' }),
    ).toEqual(at('_type', set('pageHeadingBlock')));
  });

  it('is idempotent — a pageHeadingBlock is left alone', () => {
    expect(
      renamePageHeadingBlockType({ _type: 'pageHeadingBlock' }),
    ).toBeUndefined();
  });

  it('leaves every other object alone', () => {
    expect(
      renamePageHeadingBlockType({ _type: 'moduleHeadingBlock' }),
    ).toBeUndefined();
  });
});
