import { faker } from '@faker-js/faker';
import { mockTextBlock } from '@platform/testing/portable-text-editor/fixtures';
import type { PortableTextSpan } from '@portabletext/editor';

import { findTokenRanges } from './find-token-ranges';

faker.seed(5995);

const TOKEN = faker.lorem.word();
const TOKEN_TEXT = `{${TOKEN}}`;
const PREFIX = faker.lorem.word();

const spanOf = (block: ReturnType<typeof mockTextBlock>) => {
  const [span] = block['children'] as PortableTextSpan[];
  return [{ _key: block._key }, 'children', { _key: span?._key }];
};

describe(findTokenRanges, () => {
  it('ranges over every occurrence of a token in a span', () => {
    const text = `${PREFIX} ${TOKEN_TEXT}${TOKEN_TEXT}`;
    const block = mockTextBlock({ text });
    const path = spanOf(block);
    const first = PREFIX.length + 1;
    const second = first + TOKEN_TEXT.length;

    const ranges = findTokenRanges([block], [TOKEN]);

    expect(ranges.map(({ range }) => range)).toEqual([
      {
        anchor: { path, offset: first },
        focus: { path, offset: second },
      },
      {
        anchor: { path, offset: second },
        focus: { path, offset: second + TOKEN_TEXT.length },
      },
    ]);
  });

  it('gives each range a distinct id', () => {
    const block = mockTextBlock({ text: `${TOKEN_TEXT} ${TOKEN_TEXT}` });

    const ids = findTokenRanges([block], [TOKEN]).map(({ id }) => id);

    expect(new Set(ids).size).toBe(2);
  });

  it.each([
    { case: 'the bare word', text: `${PREFIX} ${TOKEN}` },
    { case: 'another token', text: `{${PREFIX}}` },
  ])('finds nothing for $case', ({ text }) => {
    const ranges = findTokenRanges([mockTextBlock({ text })], [TOKEN]);

    expect(ranges).toEqual([]);
  });

  it('finds nothing without tokens', () => {
    const ranges = findTokenRanges([mockTextBlock({ text: TOKEN_TEXT })], []);

    expect(ranges).toEqual([]);
  });
});
