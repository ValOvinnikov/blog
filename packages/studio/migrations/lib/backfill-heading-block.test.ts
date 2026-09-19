import { at, setIfMissing } from 'sanity/migrate';

import { backfillHeadingBlock } from './backfill-heading-block';

describe(backfillHeadingBlock, () => {
  it('sets headingBlock from heading and supportingText', () => {
    const doc = {
      heading: 'Topics',
      supportingText: 'Browse every topic.',
    };

    expect(backfillHeadingBlock(doc)).toEqual([
      at(
        'headingBlock',
        setIfMissing({
          heading: 'Topics',
          supportingText: 'Browse every topic.',
        }),
      ),
    ]);
  });

  it('is a no-op when headingBlock is already set', () => {
    const doc = {
      heading: 'Topics',
      headingBlock: { heading: 'Topics' },
    };

    expect(backfillHeadingBlock(doc)).toBeUndefined();
  });

  it('is a no-op when neither heading nor supportingText is set', () => {
    expect(backfillHeadingBlock({})).toBeUndefined();
  });
});
