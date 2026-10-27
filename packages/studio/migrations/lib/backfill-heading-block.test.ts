import { faker } from '@faker-js/faker';
import { at, setIfMissing } from 'sanity/migrate';

import { backfillHeadingBlock } from './backfill-heading-block';

faker.seed(3);

const MOCK_HEADING = faker.lorem.words();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

describe(backfillHeadingBlock, () => {
  it('sets headingBlock from heading and supportingText', () => {
    const doc = {
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    };

    expect(backfillHeadingBlock(doc)).toEqual([
      at(
        'headingBlock',
        setIfMissing({
          heading: MOCK_HEADING,
          supportingText: MOCK_SUPPORTING_TEXT,
        }),
      ),
    ]);
  });

  it('leaves a document whose headingBlock is already set untouched', () => {
    const doc = {
      heading: MOCK_HEADING,
      headingBlock: { heading: MOCK_HEADING },
    };

    expect(backfillHeadingBlock(doc)).toBeUndefined();
  });

  it('leaves a document with neither heading nor supportingText untouched', () => {
    expect(backfillHeadingBlock({})).toBeUndefined();
  });
});
