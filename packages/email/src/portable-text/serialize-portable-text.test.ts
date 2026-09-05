import { serializePortableText } from './serialize-portable-text';
import type { TPortableTextNode } from './types';

function span(text: string, marks?: string[]): TPortableTextNode {
  return { _type: 'span', text, marks };
}

function block(
  overrides: Partial<TPortableTextNode> & { children?: TPortableTextNode[] },
): TPortableTextNode {
  return { _type: 'block', style: 'normal', ...overrides };
}

describe('serializePortableText', () => {
  it('returns an empty string for null, undefined and empty content', () => {
    expect(serializePortableText(null)).toBe('');
    expect(serializePortableText(undefined)).toBe('');
    expect(serializePortableText([])).toBe('');
  });

  it('renders a normal-style block as a paragraph', () => {
    const html = serializePortableText([
      block({ children: [span('Hello there.')] }),
    ]);

    expect(html).toBe('<p style="margin:0 0 16px;">Hello there.</p>');
  });

  it('renders h2/h3/h4 blocks as heading tags', () => {
    const html = serializePortableText([
      block({ style: 'h2', children: [span('Section')] }),
    ]);

    expect(html).toContain('<h2 ');
    expect(html).toContain('>Section</h2>');
  });

  it('renders strong and em marks', () => {
    const html = serializePortableText([
      block({ children: [span('bold', ['strong']), span('italic', ['em'])] }),
    ]);

    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('renders a link mark using the matching markDef href', () => {
    const html = serializePortableText([
      {
        _type: 'block',
        style: 'normal',
        children: [span('Confirm', ['link-1'])],
        markDefs: [
          {
            _key: 'link-1',
            _type: 'link',
            href: 'https://example.com/confirm',
          },
        ],
      },
    ]);

    expect(html).toContain('<a href="https://example.com/confirm"');
    expect(html).toContain('>Confirm</a>');
  });

  it('groups consecutive bullet list items into one <ul>', () => {
    const html = serializePortableText([
      block({ listItem: 'bullet', children: [span('One')] }),
      block({ listItem: 'bullet', children: [span('Two')] }),
    ]);

    expect(html.match(/<ul/g)).toHaveLength(1);
    expect(html).toContain('<li style="margin:0 0 8px;">One</li>');
    expect(html).toContain('<li style="margin:0 0 8px;">Two</li>');
  });

  it('starts a new list when the list type changes', () => {
    const html = serializePortableText([
      block({ listItem: 'bullet', children: [span('One')] }),
      block({ listItem: 'number', children: [span('Two')] }),
    ]);

    expect(html.match(/<ul/g)).toHaveLength(1);
    expect(html.match(/<ol/g)).toHaveLength(1);
  });

  it('closes an open list when a non-list block follows', () => {
    const html = serializePortableText([
      block({ listItem: 'bullet', children: [span('One')] }),
      block({ children: [span('After the list.')] }),
    ]);

    expect(html.indexOf('</ul>')).toBeLessThan(html.indexOf('<p'));
  });

  it('escapes every interpolated text node', () => {
    const html = serializePortableText([
      block({ children: [span('<script>alert(1)</script>')] }),
    ]);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes a malicious link href', () => {
    const html = serializePortableText([
      {
        _type: 'block',
        style: 'normal',
        children: [span('Click', ['link-1'])],
        markDefs: [
          {
            _key: 'link-1',
            _type: 'link',
            href: '"><script>alert(1)</script>',
          },
        ],
      },
    ]);

    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('drops a block whose _type is not "block", rather than passing it through', () => {
    const unsupported: TPortableTextNode = {
      _type: 'image',
      asset: { url: 'https://example.com/tracking-pixel.png' },
      html: '<img src="https://evil.example/x.png" onerror="steal()" />',
    };

    const html = serializePortableText([
      block({ children: [span('Kept paragraph.')] }),
      unsupported,
    ]);

    expect(html).toBe('<p style="margin:0 0 16px;">Kept paragraph.</p>');
    expect(html).not.toContain('img');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('evil.example');
  });

  it('drops a block style outside the supported set (e.g. blockquote), rather than passing it through', () => {
    const html = serializePortableText([
      block({ style: 'blockquote', children: [span('A quote.')] }),
    ]);

    expect(html).toBe('');
  });

  it('would fail loudly if unsupported blocks were ever passed through unstyled', () => {
    const futureBlockType: TPortableTextNode = {
      _type: 'futureEditorCapability',
      rawMarkup: '<div class="unstyled">not sanitized for email</div>',
    };

    const html = serializePortableText([futureBlockType]);

    expect(html).toBe('');
  });
});
