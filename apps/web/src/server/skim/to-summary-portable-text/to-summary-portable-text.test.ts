import { faker } from '@faker-js/faker';
import { SUMMARY_BLOCK_STYLE } from '@web/constants/generate-skim';

import { toSummaryPortableText } from './to-summary-portable-text';

faker.seed(7731);

const { PARAGRAPH, BULLET, NUMBER } = SUMMARY_BLOCK_STYLE;
const MOCK_PLAIN = faker.lorem.words(3);
const MOCK_BOLD = faker.lorem.word();
const MOCK_ITALIC = faker.lorem.word();

const toSpanTexts = (text: string) =>
  toSummaryPortableText([{ style: PARAGRAPH, text }])[0]?.children?.map(
    ({ text: spanText, marks }) => ({ text: spanText, marks }),
  );

describe(toSummaryPortableText, () => {
  it('keeps a paragraph out of any list', () => {
    const [block] = toSummaryPortableText([
      { style: PARAGRAPH, text: MOCK_PLAIN },
    ]);

    expect(block).toMatchObject({ _type: 'block', style: 'normal' });
    expect(block).not.toHaveProperty('listItem');
  });

  it.each([
    [BULLET, 'bullet'],
    [NUMBER, 'number'],
  ])('makes a %s block a %s list item', (style, listItem) => {
    const [block] = toSummaryPortableText([{ style, text: MOCK_PLAIN }]);

    expect(block).toMatchObject({ listItem, level: 1 });
  });

  it('turns ** and * into strong and em spans', () => {
    expect(
      toSpanTexts(`${MOCK_PLAIN} **${MOCK_BOLD}** and *${MOCK_ITALIC}*`),
    ).toEqual([
      { text: `${MOCK_PLAIN} `, marks: [] },
      { text: MOCK_BOLD, marks: ['strong'] },
      { text: ' and ', marks: [] },
      { text: MOCK_ITALIC, marks: ['em'] },
    ]);
  });

  it('leaves an unmatched asterisk as text', () => {
    expect(toSpanTexts(`${MOCK_PLAIN} * ${MOCK_BOLD}`)).toEqual([
      { text: `${MOCK_PLAIN} * ${MOCK_BOLD}`, marks: [] },
    ]);
  });

  it('gives every block and span a key unique in the summary', () => {
    const keys = toSummaryPortableText([
      { style: BULLET, text: `**${MOCK_BOLD}** ${MOCK_PLAIN}` },
      { style: BULLET, text: `*${MOCK_ITALIC}* ${MOCK_PLAIN}` },
    ]).flatMap((block) => [
      block._key,
      ...(block.children ?? []).map(({ _key }) => _key),
    ]);

    expect(new Set(keys).size).toBe(keys.length);
  });
});
