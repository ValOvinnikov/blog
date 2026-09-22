import type { TPortableTextBody } from '@blog/service';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { extractPostHeadings } from './extract-post-headings';

describe(extractPostHeadings, () => {
  it('returns an empty array for an undefined body', () => {
    expect(extractPostHeadings(undefined)).toEqual([]);
  });

  it('returns an empty array when the body has zero H2 headings', () => {
    const body: TPortableTextBody = [
      portableTextBlock('Just a paragraph.'),
      portableTextBlock('A stray subsection', { style: 'h3' }),
    ];

    expect(extractPostHeadings(body)).toEqual([]);
  });

  it('returns an empty array when the body has fewer than 3 H2 headings', () => {
    const body: TPortableTextBody = [
      portableTextBlock('First section', { style: 'h2' }),
      portableTextBlock('Some text.'),
      portableTextBlock('Second section', { style: 'h2' }),
    ];

    expect(extractPostHeadings(body)).toEqual([]);
  });

  it('returns the ordered heading list, including nested H3s, once the body has 3+ H2 headings', () => {
    const body: TPortableTextBody = [
      portableTextBlock('Getting started', { style: 'h2', key: 'k1' }),
      portableTextBlock('Intro text.'),
      portableTextBlock('Prerequisites', { style: 'h3', key: 'k2' }),
      portableTextBlock('Configuration', { style: 'h2', key: 'k3' }),
      portableTextBlock('Deployment', { style: 'h2', key: 'k4' }),
    ];

    expect(extractPostHeadings(body)).toEqual([
      { key: 'k1', text: 'Getting started', level: 2 },
      { key: 'k2', text: 'Prerequisites', level: 3 },
      { key: 'k3', text: 'Configuration', level: 2 },
      { key: 'k4', text: 'Deployment', level: 2 },
    ]);
  });

  it('ignores non-block nodes (images, code) and non-heading block styles', () => {
    const body: TPortableTextBody = [
      portableTextBlock('Section one', { style: 'h2' }),
      portableTextBlock('Section two', { style: 'h2' }),
      portableTextBlock('Section three', { style: 'h2' }),
      portableTextBlock('A quote.', { style: 'blockquote' }),
      { _type: 'code', _key: 'code-1', code: 'const x = 1;' },
    ];

    const headings = extractPostHeadings(body);

    expect(headings).toHaveLength(3);
    expect(headings.map((heading) => heading.text)).toEqual([
      'Section one',
      'Section two',
      'Section three',
    ]);
  });
});
