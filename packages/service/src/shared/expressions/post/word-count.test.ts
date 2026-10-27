import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import { mockRawParagraphTextBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { WORD_COUNT_EXPRESSION } from './word-count';

faker.seed(6020);

const MOCK_FIRST_BLOCK = mockRawParagraphTextBlock({
  _key: faker.string.uuid(),
  text: faker.lorem.words(3),
});
const MOCK_SECOND_BLOCK = mockRawParagraphTextBlock({
  _key: faker.string.uuid(),
  text: faker.lorem.words(3),
});

function wordCountOf(post: Record<string, unknown>) {
  return evaluateGroqExpression(WORD_COUNT_EXPRESSION, [], {
    _type: 'page_post',
    ...post,
  });
}

describe('WORD_COUNT_EXPRESSION', () => {
  it.each([
    {
      behaviour: 'counts the words of a single block of article text',
      post: {
        content: [
          mockRawParagraphTextBlock({
            _key: faker.string.uuid(),
            text: faker.lorem.words(5),
          }),
        ],
      },
      expected: 5,
    },
    {
      behaviour: 'counts words across multiple blocks',
      post: { content: [MOCK_FIRST_BLOCK, MOCK_SECOND_BLOCK] },
      expected: 6,
    },
    {
      behaviour: 'ignores non-text blocks between paragraphs',
      post: {
        content: [
          MOCK_FIRST_BLOCK,
          {
            _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
            _key: faker.string.uuid(),
          },
          MOCK_SECOND_BLOCK,
        ],
      },
      expected: 6,
    },
    {
      behaviour: 'yields zero when the post has no article text',
      post: {},
      expected: 0,
    },
  ])('$behaviour', async ({ post, expected }) => {
    const count = await wordCountOf(post);

    expect(count).toBe(expected);
  });
});
