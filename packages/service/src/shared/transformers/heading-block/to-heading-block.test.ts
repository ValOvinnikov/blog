import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toHeadingBlock } from './to-heading-block';

faker.seed(6101);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

describe(toHeadingBlock, () => {
  it('maps a fully-authored heading block', () => {
    const headingBlock = toHeadingBlock(
      mockRawHeadingBlock(MOCK_HEADING, {
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
    );

    expect(headingBlock).toEqual({
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    });
  });

  it('maps a missing supporting text to undefined', () => {
    const headingBlock = toHeadingBlock(mockRawHeadingBlock(MOCK_HEADING));

    expect(headingBlock).toEqual({
      heading: MOCK_HEADING,
      supportingText: undefined,
    });
  });

  it.each([null, undefined])(
    'returns undefined for an absent heading block (%s)',
    (raw) => {
      expect(toHeadingBlock(raw)).toBeUndefined();
    },
  );
});
