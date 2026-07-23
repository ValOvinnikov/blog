import type { RichText } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  richTextBlock,
  richTextSpan,
  type TRichTextBlock,
} from '@web/testing/shared/portable-text-renderer/fixtures';

import { PortableTextRenderer } from './portable-text-renderer';

const setup = customRender(PortableTextRenderer, {
  value: [],
});

describe(`<${PortableTextRenderer.name}/>`, () => {
  it('renders a normal-style block as a paragraph', () => {
    const value: RichText = [
      richTextBlock('normal', [richTextSpan('Hello world')]),
    ];

    setup({ value });

    expect(screen.getByText('Hello world', { selector: 'p' })).toBeVisible();
  });

  ([1, 2, 3, 4] as const).forEach((level) => {
    it(`renders an h${level}-style block as a level ${level} heading`, () => {
      const value: RichText = [
        richTextBlock(`h${level}` as TRichTextBlock['style'], [
          richTextSpan(`Heading ${level}`),
        ]),
      ];

      setup({ value });

      expect(
        screen.getByRole('heading', { level, name: `Heading ${level}` }),
      ).toBeVisible();
    });
  });

  it('renders a blockquote-style block as a blockquote', () => {
    const value: RichText = [
      richTextBlock('blockquote', [richTextSpan('A quote')]),
    ];

    setup({ value });

    expect(
      screen.getByText('A quote', { selector: 'blockquote' }),
    ).toBeVisible();
  });

  it('renders the strong mark as bold text', () => {
    const value: RichText = [
      richTextBlock('normal', [richTextSpan('bold text', ['strong'])]),
    ];

    setup({ value });

    expect(screen.getByText('bold text').tagName).toBe('STRONG');
  });

  it('renders the em mark as italic text', () => {
    const value: RichText = [
      richTextBlock('normal', [richTextSpan('italic text', ['em'])]),
    ];

    setup({ value });

    expect(screen.getByText('italic text').tagName).toBe('EM');
  });

  it('renders the code mark as inline code', () => {
    const value: RichText = [
      richTextBlock('normal', [richTextSpan('const x = 1', ['code'])]),
    ];

    setup({ value });

    expect(screen.getByText('const x = 1').tagName).toBe('CODE');
  });

  it('renders a link annotation as a link', () => {
    const value: RichText = [
      richTextBlock(
        'normal',
        [richTextSpan('a link', ['link-1'])],
        [{ _type: 'link', _key: 'link-1', href: 'https://example.com' }],
      ),
    ];

    setup({ value });

    const link = screen.getByRole('link', { name: 'a link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders a link annotation without an href as plain text, not a dead link', () => {
    const value: RichText = [
      richTextBlock(
        'normal',
        [richTextSpan('incomplete link', ['link-1'])],
        [{ _type: 'link', _key: 'link-1' }],
      ),
    ];

    setup({ value });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('incomplete link')).toBeVisible();
  });

  it('renders sibling blocks as direct children of a spacing-bearing root', () => {
    const value: RichText = [
      richTextBlock('h2', [richTextSpan('Section')]),
      richTextBlock('normal', [richTextSpan('First paragraph')]),
      richTextBlock('normal', [richTextSpan('Second paragraph')]),
    ];

    const { container } = setup({ value });

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

    setup({ value });

    expect(screen.getByText('example.ts')).toBeVisible();
    expect(screen.getByTestId('code-content').textContent).toContain(
      'const x = 1;',
    );
  });
});
