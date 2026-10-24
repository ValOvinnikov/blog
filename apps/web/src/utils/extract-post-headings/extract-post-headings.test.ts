import type { TPortableTextBody } from '@blog/service';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { extractPostHeadings } from './extract-post-headings';

const H2_STYLE = 'h2';
const H3_STYLE = 'h3';
const KEY_FIRST = 'k1';
const KEY_SECOND = 'k2';
const KEY_THIRD = 'k3';
const KEY_FOURTH = 'k4';
const GETTING_STARTED = 'Getting started';
const SECTION_ONE = 'Section one';
const SECTION_TWO = 'Section two';
const SECTION_THREE = 'Section three';

describe(extractPostHeadings, () => {
  it('returns an empty array for an undefined body', () => {
    expect(extractPostHeadings(undefined)).toEqual([]);
  });

  it('returns an empty array when the body has zero H2 headings', () => {
    const body: TPortableTextBody = [
      mockPortableTextBlock('Just a paragraph.'),
      mockPortableTextBlock('A stray subsection', { style: H3_STYLE }),
    ];

    expect(extractPostHeadings(body)).toEqual([]);
  });

  it('returns an empty array when the body has fewer than 3 H2 headings', () => {
    const body: TPortableTextBody = [
      mockPortableTextBlock('First section', { style: H2_STYLE }),
      mockPortableTextBlock('Some text.'),
      mockPortableTextBlock('Second section', { style: H2_STYLE }),
    ];

    expect(extractPostHeadings(body)).toEqual([]);
  });

  it('returns the ordered heading list, including nested H3s, once the body has 3+ H2 headings', () => {
    const body: TPortableTextBody = [
      mockPortableTextBlock(GETTING_STARTED, {
        style: H2_STYLE,
        key: KEY_FIRST,
      }),
      mockPortableTextBlock('Intro text.'),
      mockPortableTextBlock('Prerequisites', {
        style: H3_STYLE,
        key: KEY_SECOND,
      }),
      mockPortableTextBlock('Configuration', {
        style: H2_STYLE,
        key: KEY_THIRD,
      }),
      mockPortableTextBlock('Deployment', { style: H2_STYLE, key: KEY_FOURTH }),
    ];

    expect(extractPostHeadings(body)).toEqual([
      { key: KEY_FIRST, text: GETTING_STARTED, level: 2 },
      { key: KEY_SECOND, text: 'Prerequisites', level: 3 },
      { key: KEY_THIRD, text: 'Configuration', level: 2 },
      { key: KEY_FOURTH, text: 'Deployment', level: 2 },
    ]);
  });

  it('ignores non-block nodes (images, code) and non-heading block styles', () => {
    const body: TPortableTextBody = [
      mockPortableTextBlock(SECTION_ONE, { style: H2_STYLE }),
      mockPortableTextBlock(SECTION_TWO, { style: H2_STYLE }),
      mockPortableTextBlock(SECTION_THREE, { style: H2_STYLE }),
      mockPortableTextBlock('A quote.', { style: 'blockquote' }),
      { _type: 'code', _key: 'code-1', code: 'const x = 1;' },
    ];

    const headings = extractPostHeadings(body);

    expect(headings).toHaveLength(3);
    expect(headings.map((heading) => heading.text)).toEqual([
      SECTION_ONE,
      SECTION_TWO,
      SECTION_THREE,
    ]);
  });
});
