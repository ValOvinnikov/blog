import {
  MOCK_DATA_URL,
  MOCK_ESCAPED_SCRIPT_MARKUP,
  MOCK_JAVASCRIPT_URL,
  MOCK_SCRIPT_MARKUP,
  MOCK_TAB_SPLIT_JAVASCRIPT_URL,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';

import { serializePortableText } from './serialize-portable-text';
import type { TPortableTextNode } from './types';

const LINK_KEY = 'link-1';
const LINK_TEXT = 'Click';
const ANCHOR_OPEN = '<a ';

function mockSpan(text: string, marks?: string[]): TPortableTextNode {
  return { _type: 'span', text, marks };
}

function mockBlock(
  overrides: Partial<TPortableTextNode> & { children?: TPortableTextNode[] },
): TPortableTextNode {
  return { _type: 'block', style: 'normal', ...overrides };
}

function mockLinkBlock(href: string): TPortableTextNode {
  return mockBlock({
    children: [mockSpan(LINK_TEXT, [LINK_KEY])],
    markDefs: [{ _key: LINK_KEY, _type: 'link', href }],
  });
}

describe(serializePortableText, () => {
  it.each([null, undefined, []])(
    'returns an empty string for %j',
    (content) => {
      expect(serializePortableText(content)).toBe('');
    },
  );

  it('renders a normal-style block as a paragraph', () => {
    const html = serializePortableText([
      mockBlock({ children: [mockSpan('Hello there.')] }),
    ]);

    expect(html).toBe('<p style="margin:0 0 16px;">Hello there.</p>');
  });

  it.each(['h2', 'h3', 'h4'])(
    'renders an %s block as that heading',
    (style) => {
      const html = serializePortableText([
        mockBlock({ style, children: [mockSpan('Section')] }),
      ]);

      expect(html).toContain(`<${style} `);
      expect(html).toContain(`>Section</${style}>`);
    },
  );

  it('renders strong and em marks', () => {
    const html = serializePortableText([
      mockBlock({
        children: [mockSpan('bold', ['strong']), mockSpan('italic', ['em'])],
      }),
    ]);

    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('groups consecutive bullet list items into one list', () => {
    const html = serializePortableText([
      mockBlock({ listItem: 'bullet', children: [mockSpan('One')] }),
      mockBlock({ listItem: 'bullet', children: [mockSpan('Two')] }),
    ]);

    expect(html.match(/<ul/g)).toHaveLength(1);
    expect(html).toContain('<li style="margin:0 0 8px;">One</li>');
    expect(html).toContain('<li style="margin:0 0 8px;">Two</li>');
  });

  it('starts a new list when the list type changes', () => {
    const html = serializePortableText([
      mockBlock({ listItem: 'bullet', children: [mockSpan('One')] }),
      mockBlock({ listItem: 'number', children: [mockSpan('Two')] }),
    ]);

    expect(html.match(/<ul/g)).toHaveLength(1);
    expect(html.match(/<ol/g)).toHaveLength(1);
  });

  it('closes an open list when a non-list block follows', () => {
    const html = serializePortableText([
      mockBlock({ listItem: 'bullet', children: [mockSpan('One')] }),
      mockBlock({ children: [mockSpan('After the list.')] }),
    ]);

    expect(html.indexOf('</ul>')).toBeLessThan(html.indexOf('<p'));
  });

  it('escapes every interpolated text node', () => {
    const html = serializePortableText([
      mockBlock({ children: [mockSpan(MOCK_SCRIPT_MARKUP)] }),
    ]);

    expect(html).not.toContain(MOCK_SCRIPT_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_SCRIPT_MARKUP);
  });

  it('escapes a malicious link href', () => {
    const html = serializePortableText([
      mockLinkBlock(`">${MOCK_SCRIPT_MARKUP}`),
    ]);

    expect(html).not.toContain(MOCK_SCRIPT_MARKUP);
  });

  it('wraps a link mark in an anchor to its markDef href', () => {
    const href = `${MOCK_URL}/confirm`;

    const html = serializePortableText([mockLinkBlock(href)]);

    expect(html).toBe(
      `<p style="margin:0 0 16px;"><a href="${href}" style="color:inherit;text-decoration:underline;">${LINK_TEXT}</a></p>`,
    );
  });

  it.each([
    'http://example.com/x',
    `${MOCK_URL}/x`,
    'mailto:someone@example.com',
  ])('lets the safe href %s through unchanged', (href) => {
    const html = serializePortableText([mockLinkBlock(href)]);

    expect(html).toContain(`<a href="${href}"`);
  });

  it('keeps the text of a link whose href it drops', () => {
    const html = serializePortableText([mockLinkBlock(MOCK_JAVASCRIPT_URL)]);

    expect(html).toBe(`<p style="margin:0 0 16px;">${LINK_TEXT}</p>`);
  });

  it.each([
    ['a javascript:', MOCK_JAVASCRIPT_URL],
    ['a data:', MOCK_DATA_URL],
    ['a vbscript:', 'vbscript:msgbox(1)'],
    ['a mixed-case javascript:', 'JavaScript:alert(document.cookie)'],
    ['a tab-split javascript:', MOCK_TAB_SPLIT_JAVASCRIPT_URL],
    ['a newline-split javascript:', 'java\nscript:alert(document.cookie)'],
    ['a space-led javascript:', '   javascript:alert(document.cookie)'],
    ['a percent-encoded javascript:', 'javascript%3Aalert(1)'],
    ['a scheme-relative', '//evil.example/x'],
    ['an unparseable', 'not a url at all'],
  ])('drops the link wrapper for %s href', (_name, href) => {
    const html = serializePortableText([mockLinkBlock(href)]);

    expect(html).not.toContain(ANCHOR_OPEN);
  });

  it('drops a block whose type is not a text block', () => {
    const unsupported: TPortableTextNode = {
      _type: 'image',
      asset: { url: 'https://example.com/tracking-pixel.png' },
      html: '<img src="https://evil.example/x.png" onerror="steal()" />',
    };

    const html = serializePortableText([
      mockBlock({ children: [mockSpan('Kept paragraph.')] }),
      unsupported,
    ]);

    expect(html).toBe('<p style="margin:0 0 16px;">Kept paragraph.</p>');
  });

  it('drops a block style outside the supported set', () => {
    const html = serializePortableText([
      mockBlock({ style: 'blockquote', children: [mockSpan('A quote.')] }),
    ]);

    expect(html).toBe('');
  });
});
