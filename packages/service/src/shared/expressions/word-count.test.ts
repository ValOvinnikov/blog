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
    const first = block('a', 'one two three');
    const second = block('b', 'four five six');

    const single = (await wordCountOf({ content: [first] })) as number;
    const both = (await wordCountOf({ content: [first, second] })) as number;

    expect(both).toBeGreaterThan(single);
  });

  it('yields zero when the post has no article text', async () => {
    expect(await wordCountOf({})).toBe(0);
  });
});
