import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import { mockRawParagraphTextBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { WORD_COUNT_EXPRESSION } from './word-count';

const FIRST_TEXT = 'one two three';
const SECOND_TEXT = 'four five six';

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
            _key: 'a',
            text: 'one two three four five',
          }),
        ],
      },
      expected: 5,
    },
    {
      behaviour: 'counts words across multiple blocks',
      post: {
        content: [
          mockRawParagraphTextBlock({ _key: 'a', text: FIRST_TEXT }),
          mockRawParagraphTextBlock({ _key: 'b', text: SECOND_TEXT }),
        ],
      },
      expected: 6,
    },
    {
      behaviour: 'ignores non-text blocks between paragraphs',
      post: {
        content: [
          mockRawParagraphTextBlock({ _key: 'a', text: FIRST_TEXT }),
          { _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE, _key: 'i' },
          mockRawParagraphTextBlock({ _key: 'b', text: SECOND_TEXT }),
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
