import { toPlainText } from '@blog/studio/schema-types/portable-text/to-plain-text/to-plain-text';
import { faker } from '@faker-js/faker';

faker.seed(4114);

const MOCK_FIRST_WORD = faker.lorem.word();
const MOCK_SECOND_WORD = faker.lorem.word();
const MOCK_THIRD_WORD = faker.lorem.word();

describe(toPlainText, () => {
  it.each([
    {
      behaviour: 'joins each block child text with a space',
      blocks: [
        { children: [{ text: MOCK_FIRST_WORD }, { text: MOCK_SECOND_WORD }] },
        { children: [{ text: MOCK_THIRD_WORD }] },
      ],
      expected: `${MOCK_FIRST_WORD} ${MOCK_SECOND_WORD} ${MOCK_THIRD_WORD}`,
    },
    {
      behaviour: 'returns an empty string when no blocks are given',
      blocks: undefined,
      expected: '',
    },
    {
      behaviour: 'returns an empty string for an empty block list',
      blocks: [],
      expected: '',
    },
    {
      behaviour: 'treats a block with no children as contributing no text',
      blocks: [{}, { children: [{ text: MOCK_FIRST_WORD }] }],
      expected: MOCK_FIRST_WORD,
    },
    {
      behaviour: 'drops the space left by a child with no text',
      blocks: [{ children: [{}, { text: MOCK_FIRST_WORD }] }],
      expected: MOCK_FIRST_WORD,
    },
  ])('$behaviour', ({ blocks, expected }) => {
    expect(toPlainText(blocks)).toBe(expected);
  });
});
