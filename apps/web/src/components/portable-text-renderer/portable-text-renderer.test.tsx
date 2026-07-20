import type { RichText } from '@blog/config';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PortableTextRenderer } from './portable-text-renderer';

describe('PortableTextRenderer', () => {
  it('renders a normal-style block as a paragraph', () => {
    const value: RichText = [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'span-1', text: 'Hello world' }],
      },
    ];

    render(<PortableTextRenderer value={value} />);

    expect(screen.getByText('Hello world', { selector: 'p' })).toBeVisible();
  });

  ([1, 2, 3, 4] as const).forEach((level) => {
    it(`renders an h${level}-style block as a level ${level} heading`, () => {
      const value: RichText = [
        {
          _type: 'block',
          _key: `block-h${level}`,
          style: `h${level}` as `h${1 | 2 | 3 | 4}`,
          children: [
            { _type: 'span', _key: 'span-1', text: `Heading ${level}` },
          ],
        },
      ];

      render(<PortableTextRenderer value={value} />);

      expect(
        screen.getByRole('heading', { level, name: `Heading ${level}` }),
      ).toBeVisible();
    });
  });

  it('renders the strong mark as bold text', () => {
    const value: RichText = [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span-1',
            text: 'bold text',
            marks: ['strong'],
          },
        ],
      },
    ];

    render(<PortableTextRenderer value={value} />);

    const strong = screen.getByText('bold text');
    expect(strong.tagName).toBe('STRONG');
  });

  it('renders the em mark as italic text', () => {
    const value: RichText = [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        children: [
          { _type: 'span', _key: 'span-1', text: 'italic text', marks: ['em'] },
        ],
      },
    ];

    render(<PortableTextRenderer value={value} />);

    const em = screen.getByText('italic text');
    expect(em.tagName).toBe('EM');
  });

  it('renders the code mark as inline code', () => {
    const value: RichText = [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span-1',
            text: 'const x = 1',
            marks: ['code'],
          },
        ],
      },
    ];

    render(<PortableTextRenderer value={value} />);

    const code = screen.getByText('const x = 1');
    expect(code.tagName).toBe('CODE');
  });

  it('renders a link annotation as a link', () => {
    const value: RichText = [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        markDefs: [
          { _type: 'link', _key: 'link-1', href: 'https://example.com' },
        ],
        children: [
          {
            _type: 'span',
            _key: 'span-1',
            text: 'a link',
            marks: ['link-1'],
          },
        ],
      },
    ];

    render(<PortableTextRenderer value={value} />);

    const link = screen.getByRole('link', { name: 'a link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders a link annotation without an href as plain text, not a dead link', () => {
    const value: RichText = [
      {
        _type: 'block',
        _key: 'block-1',
        style: 'normal',
        markDefs: [{ _type: 'link', _key: 'link-1' }],
        children: [
          {
            _type: 'span',
            _key: 'span-1',
            text: 'incomplete link',
            marks: ['link-1'],
          },
        ],
      },
    ];

    render(<PortableTextRenderer value={value} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('incomplete link')).toBeVisible();
  });

  it('renders sibling blocks as direct children of a spacing-bearing root', () => {
    const value: RichText = [
      {
        _type: 'block',
        _key: 'block-h1',
        style: 'h2',
        children: [{ _type: 'span', _key: 'span-1', text: 'Section' }],
      },
      {
        _type: 'block',
        _key: 'block-p1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'span-2', text: 'First paragraph' }],
      },
      {
        _type: 'block',
        _key: 'block-p2',
        style: 'normal',
        children: [
          { _type: 'span', _key: 'span-3', text: 'Second paragraph' },
        ],
      },
    ];

    const { container } = render(<PortableTextRenderer value={value} />);

    const root = container.firstElementChild;

    // Blocks render as direct siblings (no per-block wrapper) so the single
    // `[&>*+*]:mt-*` rule on `root` applies a spacing rhythm between all of
    // them; a per-block wrapper here would put the rule between wrappers,
    // not between the visible blocks it targets. Verified visually via the
    // `Content` story in `portable-text-renderer.stories.tsx` — see also
    // `web-storybook` skill for how RSC-averse compositions get previewed.
    expect(root?.className).toContain('[&>*+*]:mt-6');
    expect(root?.children).toHaveLength(3);
    expect(root?.children[0]?.tagName).toBe('H2');
    expect(root?.children[1]?.tagName).toBe('P');
    expect(root?.children[2]?.tagName).toBe('P');
  });

  it('renders a code block with syntax highlighting', () => {
    const value: RichText = [
      {
        _type: 'code',
        _key: 'code-1',
        language: 'typescript',
        filename: 'example.ts',
        code: 'const x = 1;',
      },
    ];

    const { container } = render(<PortableTextRenderer value={value} />);

    expect(screen.getByText('example.ts')).toBeVisible();
    expect(container.querySelector('pre')?.textContent).toContain(
      'const x = 1;',
    );
  });
});
