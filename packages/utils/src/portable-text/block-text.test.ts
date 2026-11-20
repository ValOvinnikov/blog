import { faker } from '@faker-js/faker';

import { countBlockWords, hasBlockText, toBlockText } from './block-text';

faker.seed(7731);

const MOCK_WORD_START = faker.lorem.word();
const MOCK_WORD_END = faker.lorem.word();
const MOCK_SECOND_WORD = faker.lorem.word();

describe(toBlockText, () => {
  it('joins spans without a separator, so a mark inside a word keeps it whole', () => {
    expect(
      toBlockText({
        children: [{ text: MOCK_WORD_START }, { text: MOCK_WORD_END }],
      }),
    ).toBe(`${MOCK_WORD_START}${MOCK_WORD_END}`);
  });

  it.each([
    { behaviour: 'has no text without children', block: {} },
    { behaviour: 'has no text with null children', block: { children: null } },
    {
      behaviour: 'has no text for a span with none',
      block: { children: [{}] },
    },
  ])('$behaviour', ({ block }) => {
    expect(toBlockText(block)).toBe('');
  });
});

describe(countBlockWords, () => {
  it('counts words across blocks', () => {
    expect(
      countBlockWords([
        { children: [{ text: MOCK_WORD_START }, { text: MOCK_WORD_END }] },
        { children: [{ text: `${MOCK_SECOND_WORD} ${MOCK_SECOND_WORD}` }] },
      ]),
    ).toBe(3);
  });

  it('counts no words in no blocks', () => {
    expect(countBlockWords([])).toBe(0);
  });
});

describe(hasBlockText, () => {
  it('finds text in any block', () => {
    expect(
      hasBlockText([
        { children: [{ text: ' ' }] },
        { children: [{ text: MOCK_SECOND_WORD }] },
      ]),
    ).toBe(true);
  });

  it.each([
    { behaviour: 'no blocks', blocks: [] },
    { behaviour: 'only whitespace', blocks: [{ children: [{ text: ' ' }] }] },
  ])('finds no text in $behaviour', ({ blocks }) => {
    expect(hasBlockText(blocks)).toBe(false);
  });
});
