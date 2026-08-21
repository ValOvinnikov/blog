import { ASIDE_KIND, type RichText } from '@blog/config';
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
import type { ReactNode } from 'react';

import { PortableTextRenderer } from './portable-text-renderer';

// Only `ImageWithCaption` is faked (the renderer also pulls `Aside` from
// `@blog/ui/molecules` via `DeepAside`, so this must stay a partial mock).
// Faking it keeps the `layout` pass-through assertion behavioural (a
// `data-layout` attribute) rather than a CSS-class assertion on the real
// component's `tv()` output.
vi.mock('@blog/ui/molecules', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@blog/ui/molecules')>();

  return {
    ...actual,
    ImageWithCaption: ({
      layout,
      children,
    }: {
      layout?: string;
      children?: ReactNode;
    }) => (
      <div data-testid="image-with-caption" data-layout={layout}>
        {children}
      </div>
    ),
  };
});

const setup = customRender(PortableTextRenderer, {
  value: [],
  baseUrl: 'https://cdn.sanity.io/images/test-project/test-dataset/',
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

  it('gives h2/h3 blocks a stable, URL-safe id once the caller opts in with the pre-computed headings, so PostContentsRail links (and deep-links) resolve to the right heading', () => {
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

    const prerequisites = screen.getByRole('heading', {
      level: 3,
      name: 'Prerequisites',
    });
    expect(prerequisites).toHaveAttribute('id', 'prerequisites');

    expect(
      screen.getByRole('heading', { level: 2, name: 'Configuration' }),
    ).toHaveAttribute('id', 'configuration');
  });

  it("renders h2/h3 blocks with no id when headings is passed but the body has fewer than 3 H2 headings, matching extractPostHeadings' own below-threshold []", () => {
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
      <PortableTextRenderer
        value={firstModuleBody}
        baseUrl="https://cdn.sanity.io/images/test-project/test-dataset/"
      />,
    );
    const { container: secondContainer } = renderElement(
      <PortableTextRenderer
        value={secondModuleBody}
        baseUrl="https://cdn.sanity.io/images/test-project/test-dataset/"
      />,
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

  it('renders a bodyImage block as an img with the CMS alt text, no unknown-block warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const value: RichText = [
      {
        _type: 'bodyImage',
        _key: 'image-1',
        asset: {
          _ref: 'image-abc123-800x600-jpg',
          _type: 'reference',
        },
        alt: 'A scenic mountain range',
      },
    ];

    setup({ value });

    const img = screen.getByRole('img', { name: 'A scenic mountain range' });
    expect(img).toHaveAttribute(
      'src',
      expect.stringContaining('https://cdn.sanity.io'),
    );
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Unknown block type'),
    );

    warnSpy.mockRestore();
  });

  it('renders nothing for a bodyImage block with no asset reference', () => {
    const value: RichText = [
      {
        _type: 'bodyImage',
        _key: 'image-1',
        alt: 'Missing asset',
      },
    ];

    const { container } = setup({ value });

    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it("passes the block's chosen layout through to ImageWithCaption", () => {
    const value: RichText = [
      {
        _type: 'bodyImage',
        _key: 'image-1',
        asset: {
          _ref: 'image-abc123-800x600-jpg',
          _type: 'reference',
        },
        alt: 'A scenic mountain range',
        layout: 'FLOAT_LEFT',
      },
    ];

    setup({ value });

    expect(screen.getByTestId('image-with-caption')).toHaveAttribute(
      'data-layout',
      'FLOAT_LEFT',
    );
  });

  it('passes no layout through when the block has none set, leaving the INLINE default to ImageWithCaption', () => {
    const value: RichText = [
      {
        _type: 'bodyImage',
        _key: 'image-1',
        asset: {
          _ref: 'image-abc123-800x600-jpg',
          _type: 'reference',
        },
        alt: 'A scenic mountain range',
      },
    ];

    setup({ value });

    expect(screen.getByTestId('image-with-caption')).not.toHaveAttribute(
      'data-layout',
    );
  });

  it('renders a FULL_BLEED bodyImage as a sibling of the surrounding text, not nested inside the same wrapper as the text before/after it (#1070 — a FULL_BLEED image must be free of the text measure cap)', () => {
    const value: RichText = [
      richTextBlock('normal', [richTextSpan('Before the image.')]),
      {
        _type: 'bodyImage',
        _key: 'image-1',
        asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
        alt: 'A scenic mountain range',
        layout: 'FULL_BLEED',
      },
      richTextBlock('normal', [richTextSpan('After the image.')]),
    ];

    setup({ value });

    const image = screen.getByTestId('image-with-caption');
    expect(image).toHaveAttribute('data-layout', 'FULL_BLEED');

    const before = screen.getByText('Before the image.');
    const after = screen.getByText('After the image.');

    expect(image.parentElement).not.toBe(before.parentElement);
    expect(image.parentElement).not.toBe(after.parentElement);
    expect(before.parentElement).not.toBe(after.parentElement);
  });

  it('keeps every block a direct child of a single wrapper when the body has a non-FULL_BLEED bodyImage (INLINE/FLOAT_LEFT/FLOAT_RIGHT stay nested with the surrounding text, unaffected by the FULL_BLEED breakout split)', () => {
    const value: RichText = [
      richTextBlock('normal', [richTextSpan('Before the image.')]),
      {
        _type: 'bodyImage',
        _key: 'image-1',
        asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
        alt: 'A scenic mountain range',
        layout: 'FLOAT_LEFT',
      },
      richTextBlock('normal', [richTextSpan('After the image.')]),
    ];

    setup({ value });

    const image = screen.getByTestId('image-with-caption');
    const before = screen.getByText('Before the image.');
    const after = screen.getByText('After the image.');

    expect(image.parentElement).toBe(before.parentElement);
    expect(image.parentElement).toBe(after.parentElement);
  });

  it('renders an aside block as a DeepAside, with its body rendered through the same block components (visibility gating is pure CSS — no unit-test surface, see deep-aside.test.tsx)', () => {
    const value: RichText = [
      {
        _type: 'aside',
        _key: 'aside-1',
        kind: ASIDE_KIND.WHY_NOT,
        body: [richTextBlock('normal', [richTextSpan('Because Y.')])],
      },
    ];

    setup({ value, asideKindLabels: { [ASIDE_KIND.WHY_NOT]: 'Why not X' } });

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText('Why not X')).toBeVisible();
    expect(screen.getByText('Because Y.')).toBeVisible();
  });

  it('falls back to the raw kind value as the aside label when asideKindLabels is omitted', () => {
    const value: RichText = [
      {
        _type: 'aside',
        _key: 'aside-1',
        kind: ASIDE_KIND.DIGRESSION,
        body: [richTextBlock('normal', [richTextSpan('A tangent.')])],
      },
    ];

    setup({ value });

    expect(screen.getByText(ASIDE_KIND.DIGRESSION)).toBeVisible();
  });

  it('treats a missing aside kind as CONTEXT (forward-compat)', () => {
    const value: RichText = [
      {
        _type: 'aside',
        _key: 'aside-1',
        body: [richTextBlock('normal', [richTextSpan('Some context.')])],
      },
    ];

    setup({ value, asideKindLabels: { [ASIDE_KIND.CONTEXT]: 'Context' } });

    expect(screen.getByText('Context')).toBeVisible();
  });
});
