import type { RichText } from '@blog/config';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import {
  richTextBlock,
  richTextSpan,
  type TRichTextBlock,
} from '@web/testing/shared/portable-text-renderer/fixtures';
import { extractPostHeadings } from '@web/utils/extract-post-headings/extract-post-headings';

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

  it('renders an h1-style block downgraded to a level 2 heading, never a bare h1', () => {
    const value: RichText = [
      // The generated `style` union no longer includes 'h1' (Studio can't
      // author one anymore), but the renderer still defends against a
      // legacy/malformed one reaching this component via another write path.
      richTextBlock('h1' as TRichTextBlock['style'], [
        richTextSpan('Heading 1'),
      ]),
    ];

    setup({ value });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Heading 1',
    });
    expect(heading).toBeVisible();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  ([2, 3, 4] as const).forEach((level) => {
    it(`renders an h${level}-style block as a level ${level} heading`, () => {
      const value: RichText = [
        richTextBlock(`h${level}` as TRichTextBlock['style'], [
          richTextSpan(`Heading ${level}`),
        ]),
      ];

      setup({ value });

      const heading = screen.getByRole('heading', {
        level,
        name: `Heading ${level}`,
      });
      expect(heading).toBeVisible();
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

  it('renders sibling blocks as direct children of the root, with no per-block wrapper', () => {
    const value: RichText = [
      richTextBlock('h2', [richTextSpan('Section')]),
      richTextBlock('normal', [richTextSpan('First paragraph')]),
      richTextBlock('normal', [richTextSpan('Second paragraph')]),
    ];

    const { container } = setup({ value });

    const root = container.firstElementChild;

    expect(root?.children).toHaveLength(3);
    expect(root?.children[0]?.tagName).toBe('H2');
    expect(root?.children[1]?.tagName).toBe('P');
    expect(root?.children[2]?.tagName).toBe('P');
  });

  it('renders h2/h3 blocks with no id when the caller omits headings, even with 3+ H2 headings in the body (the page-builder-module default)', () => {
    const value: RichText = [
      richTextBlock('h2', [richTextSpan('Getting started')]),
      richTextBlock('normal', [richTextSpan('Intro.')]),
      richTextBlock('h3', [richTextSpan('Prerequisites')]),
      richTextBlock('h2', [richTextSpan('Configuration')]),
      richTextBlock('h2', [richTextSpan('Deployment')]),
    ];

    setup({ value });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Getting started' }),
    ).not.toHaveAttribute('id');
    expect(
      screen.getByRole('heading', { level: 3, name: 'Prerequisites' }),
    ).not.toHaveAttribute('id');
  });

  it('gives h2/h3 blocks a stable, URL-safe id and a scroll-mt-* anchor offset once the caller opts in with the pre-computed headings, so PostContentsRail links (and deep-links) resolve below the sticky header, not behind it', () => {
    const value: RichText = [
      richTextBlock('h2', [richTextSpan('Getting started')]),
      richTextBlock('normal', [richTextSpan('Intro.')]),
      richTextBlock('h3', [richTextSpan('Prerequisites')]),
      richTextBlock('h2', [richTextSpan('Configuration')]),
      richTextBlock('h2', [richTextSpan('Deployment')]),
    ];

    setup({ value, headings: extractPostHeadings(value) });

    const gettingStarted = screen.getByRole('heading', {
      level: 2,
      name: 'Getting started',
    });
    expect(gettingStarted).toHaveAttribute('id', 'getting-started');
    expect(gettingStarted.className).toContain('scroll-mt-24');

    const prerequisites = screen.getByRole('heading', {
      level: 3,
      name: 'Prerequisites',
    });
    expect(prerequisites).toHaveAttribute('id', 'prerequisites');
    expect(prerequisites.className).toContain('scroll-mt-24');

    expect(
      screen.getByRole('heading', { level: 2, name: 'Configuration' }),
    ).toHaveAttribute('id', 'configuration');
  });

  it("renders h2/h3 blocks with no id (and no scroll-mt-*) when headings is passed but the body has fewer than 3 H2 headings, matching extractPostHeadings' own below-threshold []", () => {
    const value: RichText = [
      richTextBlock('h2', [richTextSpan('Only section')]),
      richTextBlock('normal', [richTextSpan('Some text.')]),
    ];

    setup({ value, headings: extractPostHeadings(value) });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Only section',
    });
    expect(heading).not.toHaveAttribute('id');
    expect(heading.className).not.toContain('scroll-mt-24');
  });

  it('never lets two separate PortableTextRenderer instances on the same page collide on heading ids — neither passes headings, so neither stamps any (the module_content-rendered-twice scenario)', () => {
    const firstModuleBody: RichText = [
      richTextBlock('h2', [richTextSpan('Overview')]),
      richTextBlock('h2', [richTextSpan('Details')]),
      richTextBlock('h2', [richTextSpan('Summary')]),
    ];
    const secondModuleBody: RichText = [
      // Same heading text as the first module's outline — this is exactly
      // the scenario `module_content` can hit twice on one `page_generic`.
      richTextBlock('h2', [richTextSpan('Overview')]),
      richTextBlock('h2', [richTextSpan('Details')]),
      richTextBlock('h2', [richTextSpan('Summary')]),
    ];

    const { container: firstContainer } = renderElement(
      <PortableTextRenderer value={firstModuleBody} />,
    );
    const { container: secondContainer } = renderElement(
      <PortableTextRenderer value={secondModuleBody} />,
    );

    const firstIds = Array.from(firstContainer.querySelectorAll('h2')).map(
      (heading) => heading.getAttribute('id'),
    );
    const secondIds = Array.from(secondContainer.querySelectorAll('h2')).map(
      (heading) => heading.getAttribute('id'),
    );

    // Neither instance was opted in (no `headings` prop), so neither stamps
    // any id at all — the collision the un-gated behaviour used to risk.
    expect(firstIds.every((id) => id === null)).toBe(true);
    expect(secondIds.every((id) => id === null)).toBe(true);
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
