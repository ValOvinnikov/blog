import type { TPortableTextBody } from '@blog/config';
import {
  richTextBlock,
  richTextSpan,
} from '@web/testing/shared/portable-text-renderer/fixtures';

import { extractPostHeadings } from './extract-post-headings';

describe(extractPostHeadings, () => {
  it('returns an empty array for an undefined body', () => {
    expect(extractPostHeadings(undefined)).toEqual([]);
  });

  it('returns an empty array when the body has zero H2 headings', () => {
    const body: TPortableTextBody = [
      richTextBlock('normal', [richTextSpan('Just a paragraph.')]),
      richTextBlock('h3', [richTextSpan('A stray subsection')]),
    ];

    expect(extractPostHeadings(body)).toEqual([]);
  });

  it('returns an empty array when the body has fewer than 3 H2 headings', () => {
    const body: TPortableTextBody = [
      richTextBlock('h2', [richTextSpan('First section')]),
      richTextBlock('normal', [richTextSpan('Some text.')]),
      richTextBlock('h2', [richTextSpan('Second section')]),
    ];

    expect(extractPostHeadings(body)).toEqual([]);
  });

  it('returns the ordered heading list, including nested H3s, once the body has 3+ H2 headings', () => {
    const body: TPortableTextBody = [
      richTextBlock('h2', [richTextSpan('Getting started')]),
      richTextBlock('normal', [richTextSpan('Intro text.')]),
      richTextBlock('h3', [richTextSpan('Prerequisites')]),
      richTextBlock('h2', [richTextSpan('Configuration')]),
      richTextBlock('h2', [richTextSpan('Deployment')]),
    ];

    expect(extractPostHeadings(body)).toEqual([
      {
        id: 'getting-started',
        text: 'Getting started',
        level: 2,
        key: expect.any(String),
      },
      {
        id: 'prerequisites',
        text: 'Prerequisites',
        level: 3,
        key: expect.any(String),
      },
      {
        id: 'configuration',
        text: 'Configuration',
        level: 2,
        key: expect.any(String),
      },
      {
        id: 'deployment',
        text: 'Deployment',
        level: 2,
        key: expect.any(String),
      },
    ]);
  });

  it('produces stable, URL-safe slugs from heading text (lower-cased, punctuation stripped, spaces hyphenated)', () => {
    const body: TPortableTextBody = [
      richTextBlock('h2', [richTextSpan('One')]),
      richTextBlock('h2', [richTextSpan('Two')]),
      richTextBlock('h2', [richTextSpan("What's New? (v2.0!)")]),
    ];

    const headings = extractPostHeadings(body);

    expect(headings.map((heading) => heading.id)).toEqual([
      'one',
      'two',
      'what-s-new-v2-0',
    ]);
    headings.forEach((heading) => {
      expect(heading.id).toMatch(/^[a-z0-9-]+$/);
    });
  });

  it('dedupes identical heading text with a numeric suffix', () => {
    const body: TPortableTextBody = [
      richTextBlock('h2', [richTextSpan('Overview')]),
      richTextBlock('h2', [richTextSpan('Overview')]),
      richTextBlock('h2', [richTextSpan('Overview')]),
    ];

    const headings = extractPostHeadings(body);

    expect(headings.map((heading) => heading.id)).toEqual([
      'overview',
      'overview-2',
      'overview-3',
    ]);
  });

  it('ignores non-block nodes (images, code) and non-heading block styles', () => {
    const body: TPortableTextBody = [
      richTextBlock('h2', [richTextSpan('Section one')]),
      richTextBlock('h2', [richTextSpan('Section two')]),
      richTextBlock('h2', [richTextSpan('Section three')]),
      richTextBlock('blockquote', [richTextSpan('A quote.')]),
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
