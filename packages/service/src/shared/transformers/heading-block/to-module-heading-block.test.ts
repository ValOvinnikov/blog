import { faker } from '@faker-js/faker';
import { HEADING_TEXT_MARK } from '@shinefold/config/constants';

import { toModuleHeadingBlock } from './to-module-heading-block';

faker.seed(8044);

const MOCK_LEAD = `${faker.lorem.words(2)} `;
const MOCK_MARKED = faker.lorem.word();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

describe(toModuleHeadingBlock, () => {
  it('returns the plain words of a highlighted heading as if it were unmarked', () => {
    const raw = {
      heading: [
        {
          _type: 'block' as const,
          _key: MOCK_LEAD,
          markDefs: [],
          children: [
            {
              _type: 'span' as const,
              _key: MOCK_LEAD,
              text: MOCK_LEAD,
              marks: [],
            },
            {
              _type: 'span' as const,
              _key: MOCK_MARKED,
              text: MOCK_MARKED,
              marks: [HEADING_TEXT_MARK.HIGHLIGHT],
            },
          ],
        },
      ],
      supportingText: MOCK_SUPPORTING_TEXT,
    };

    expect(toModuleHeadingBlock(raw)).toEqual({
      heading: `${MOCK_LEAD}${MOCK_MARKED}`,
      headingPieces: [
        { text: MOCK_LEAD, isHighlighted: false },
        { text: MOCK_MARKED, isHighlighted: true },
      ],
      supportingText: MOCK_SUPPORTING_TEXT,
    });
  });

  it.each([null, undefined])(
    'returns undefined for an absent heading block (%s)',
    (raw) => {
      expect(toModuleHeadingBlock(raw)).toBeUndefined();
    },
  );
});
