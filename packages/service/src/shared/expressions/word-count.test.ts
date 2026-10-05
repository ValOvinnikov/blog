import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { WORD_COUNT_EXPRESSION } from './word-count';

function block(key: string, text: string) {
  return {
    _key: key,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _key: `${key}-span`, _type: 'span', text, marks: [] }],
  };
}

function wordCountOf(post: Record<string, unknown>) {
  return evaluateGroqExpression(WORD_COUNT_EXPRESSION, [], {
    _type: 'page_post',
    ...post,
  });
}

describe('WORD_COUNT_EXPRESSION', () => {
  it('counts the words of a single block of article text', async () => {
    const count = await wordCountOf({
      content: [block('a', 'one two three four five')],
    });

    expect(count).toBe(5);
  });

  it('counts words across multiple blocks', async () => {
    const count = await wordCountOf({
      content: [block('a', 'one two three'), block('b', 'four five six')],
    });

    expect(count).toBe(6);
  });

  it('ignores non-text blocks between paragraphs', async () => {
    const count = await wordCountOf({
      content: [
        block('a', 'one two three'),
        { _type: 'imageWithAlt', _key: 'i' },
        block('b', 'four five six'),
      ],
    });

    expect(count).toBe(6);
  });

  it('yields zero when the post has no article text', async () => {
    expect(await wordCountOf({})).toBe(0);
  });
});
