import { faker } from '@faker-js/faker';

import { portableTextToPlainText } from './portable-text-to-plain-text';
import type {
  TVoicePortableTextBlock,
  TVoicePortableTextSpan,
} from './voice-portable-text';

faker.seed(6028);

const MOCK_FIRST_SENTENCE = faker.lorem.sentence();
const MOCK_SECOND_SENTENCE = faker.lorem.sentence();
const MOCK_BOLD_WORD = faker.lorem.word();
const MOCK_PLAIN_WORD = faker.lorem.word();

const mockSpan = (text: string, marks?: string[]): TVoicePortableTextSpan => ({
  _type: 'span',
  _key: faker.string.uuid(),
  text,
  ...(marks && { marks }),
});

const mockBlock = (
  ...children: TVoicePortableTextSpan[]
): TVoicePortableTextBlock => ({
  _type: 'block',
  _key: faker.string.uuid(),
  style: 'normal',
  children,
});

describe(portableTextToPlainText, () => {
  it('joins a single block into plain text', () => {
    const value = [mockBlock(mockSpan(MOCK_FIRST_SENTENCE))];

    expect(portableTextToPlainText(value)).toBe(MOCK_FIRST_SENTENCE);
  });

  it('drops mark formatting and keeps only the text', () => {
    const value = [
      mockBlock(
        mockSpan(MOCK_BOLD_WORD, ['strong']),
        mockSpan(` ${MOCK_PLAIN_WORD}`),
      ),
    ];

    expect(portableTextToPlainText(value)).toBe(
      `${MOCK_BOLD_WORD} ${MOCK_PLAIN_WORD}`,
    );
  });

  it('joins multiple blocks with a single space', () => {
    const value = [
      mockBlock(mockSpan(MOCK_FIRST_SENTENCE)),
      mockBlock(mockSpan(MOCK_SECOND_SENTENCE)),
    ];

    expect(portableTextToPlainText(value)).toBe(
      `${MOCK_FIRST_SENTENCE} ${MOCK_SECOND_SENTENCE}`,
    );
  });

  it('converts blocks that carry only children text', () => {
    const value = [{ children: [{ text: MOCK_FIRST_SENTENCE }] }];

    expect(portableTextToPlainText(value)).toBe(MOCK_FIRST_SENTENCE);
  });

  it.each([[[]], [undefined]])('returns an empty string for %j', (value) => {
    expect(portableTextToPlainText(value)).toBe('');
  });
});
