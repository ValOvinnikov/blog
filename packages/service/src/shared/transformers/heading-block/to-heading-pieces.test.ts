import { faker } from '@faker-js/faker';
import { HEADING_TEXT_MARK } from '@shinefold/config/constants';

import { toHeadingPieces } from './to-heading-pieces';

faker.seed(8043);

const MOCK_LEAD = `${faker.lorem.words(2)} `;
const MOCK_MARKED = faker.lorem.word();
const MOCK_TAIL = ` ${faker.lorem.words(2)}`;
const MOCK_SECOND_MARKED = faker.lorem.word();
const MOCK_OTHER_MARK = faker.lorem.word();

function span(text: string, marks: string[] = []) {
  return { text, marks };
}

describe(toHeadingPieces, () => {
  it('returns one plain piece for a heading with no highlight', () => {
    expect(toHeadingPieces([{ children: [span(MOCK_LEAD)] }])).toEqual([
      { text: MOCK_LEAD, isHighlighted: false },
    ]);
  });

  it('flags each highlighted phrase in order', () => {
    const blocks = [
      {
        children: [
          span(MOCK_LEAD),
          span(MOCK_MARKED, [HEADING_TEXT_MARK.HIGHLIGHT]),
          span(MOCK_TAIL),
          span(MOCK_SECOND_MARKED, [HEADING_TEXT_MARK.HIGHLIGHT]),
        ],
      },
    ];

    expect(toHeadingPieces(blocks)).toEqual([
      { text: MOCK_LEAD, isHighlighted: false },
      { text: MOCK_MARKED, isHighlighted: true },
      { text: MOCK_TAIL, isHighlighted: false },
      { text: MOCK_SECOND_MARKED, isHighlighted: true },
    ]);
  });

  it('merges neighbouring spans that share a highlight state', () => {
    const blocks = [
      {
        children: [
          span(MOCK_LEAD),
          span(MOCK_OTHER_MARK, [MOCK_OTHER_MARK]),
          span(''),
        ],
      },
    ];

    expect(toHeadingPieces(blocks)).toEqual([
      { text: `${MOCK_LEAD}${MOCK_OTHER_MARK}`, isHighlighted: false },
    ]);
  });

  it('joins blocks with a plain space', () => {
    const blocks = [
      { children: [span(MOCK_MARKED, [HEADING_TEXT_MARK.HIGHLIGHT])] },
      { children: [span(MOCK_SECOND_MARKED, [HEADING_TEXT_MARK.HIGHLIGHT])] },
    ];

    expect(toHeadingPieces(blocks)).toEqual([
      { text: MOCK_MARKED, isHighlighted: true },
      { text: ' ', isHighlighted: false },
      { text: MOCK_SECOND_MARKED, isHighlighted: true },
    ]);
  });
});
