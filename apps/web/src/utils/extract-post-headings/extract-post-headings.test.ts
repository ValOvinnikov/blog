import type { TPortableTextBody } from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import {
  extractPostHeadings,
  MIN_H2_HEADINGS_FOR_RAIL,
} from './extract-post-headings';

faker.seed(110);

const H2_STYLE = 'h2';
const H3_STYLE = 'h3';
const BLOCKQUOTE_STYLE = 'blockquote';

const [MOCK_FIRST_KEY, MOCK_SECOND_KEY, MOCK_THIRD_KEY, MOCK_FOURTH_KEY] =
  faker.helpers.uniqueArray(faker.string.uuid, 4) as [
    string,
    string,
    string,
    string,
  ];
const [MOCK_H2_TEXT, MOCK_H3_TEXT, MOCK_SECOND_H2_TEXT, MOCK_THIRD_H2_TEXT] =
  faker.helpers.uniqueArray(faker.lorem.words, 4) as [
    string,
    string,
    string,
    string,
  ];
const MOCK_PARAGRAPH_TEXT = faker.lorem.sentence();

const mockH2Blocks = (count: number): TPortableTextBody =>
  Array.from({ length: count }, () =>
    mockPortableTextBlock(faker.lorem.words(2), { style: H2_STYLE }),
  );

describe(extractPostHeadings, () => {
  it('returns an empty array for an undefined body', () => {
    const headings = extractPostHeadings(undefined);

    expect(headings).toEqual([]);
  });

  it('returns an empty array when the body has no H2 headings', () => {
    const body: TPortableTextBody = [
      mockPortableTextBlock(MOCK_PARAGRAPH_TEXT),
      mockPortableTextBlock(MOCK_H3_TEXT, { style: H3_STYLE }),
    ];

    const headings = extractPostHeadings(body);

    expect(headings).toEqual([]);
  });

  it('returns an empty array below the minimum number of H2 headings', () => {
    const body: TPortableTextBody = [
      ...mockH2Blocks(MIN_H2_HEADINGS_FOR_RAIL - 1),
      mockPortableTextBlock(MOCK_PARAGRAPH_TEXT),
    ];

    const headings = extractPostHeadings(body);

    expect(headings).toEqual([]);
  });

  it('returns the ordered outline, nested H3s included, at the minimum', () => {
    const body: TPortableTextBody = [
      mockPortableTextBlock(MOCK_H2_TEXT, {
        style: H2_STYLE,
        key: MOCK_FIRST_KEY,
      }),
      mockPortableTextBlock(MOCK_PARAGRAPH_TEXT),
      mockPortableTextBlock(MOCK_H3_TEXT, {
        style: H3_STYLE,
        key: MOCK_SECOND_KEY,
      }),
      mockPortableTextBlock(MOCK_SECOND_H2_TEXT, {
        style: H2_STYLE,
        key: MOCK_THIRD_KEY,
      }),
      mockPortableTextBlock(MOCK_THIRD_H2_TEXT, {
        style: H2_STYLE,
        key: MOCK_FOURTH_KEY,
      }),
    ];

    const headings = extractPostHeadings(body);

    expect(headings).toEqual([
      { key: MOCK_FIRST_KEY, text: MOCK_H2_TEXT, level: 2 },
      { key: MOCK_SECOND_KEY, text: MOCK_H3_TEXT, level: 3 },
      { key: MOCK_THIRD_KEY, text: MOCK_SECOND_H2_TEXT, level: 2 },
      { key: MOCK_FOURTH_KEY, text: MOCK_THIRD_H2_TEXT, level: 2 },
    ]);
  });

  it('ignores non-block nodes and non-heading block styles', () => {
    const h2Blocks = mockH2Blocks(MIN_H2_HEADINGS_FOR_RAIL);
    const body: TPortableTextBody = [
      ...h2Blocks,
      mockPortableTextBlock(MOCK_PARAGRAPH_TEXT, { style: BLOCKQUOTE_STYLE }),
      { _type: 'code', _key: faker.string.uuid(), code: faker.lorem.word() },
    ];

    const headings = extractPostHeadings(body);

    expect(headings.map((heading) => heading.key)).toEqual(
      h2Blocks.map((block) => block._key),
    );
  });

  it('skips headings with no text and does not count them', () => {
    const body: TPortableTextBody = [
      ...mockH2Blocks(MIN_H2_HEADINGS_FOR_RAIL - 1),
      mockPortableTextBlock('  ', { style: H2_STYLE }),
    ];

    const headings = extractPostHeadings(body);

    expect(headings).toEqual([]);
  });
});
