import { customRender, screen } from '@web/testing/custom-render';

import { CodeBlock } from './code-block';

const setup = customRender(CodeBlock, {
  code: 'const x = 1;',
  language: 'typescript',
});

describe(`<${CodeBlock.name}/>`, () => {
  it('renders the code content', () => {
    setup();

    expect(screen.getByTestId('code-content').textContent).toBe(
      '1const x = 1;',
    );
  });

  it('renders the filename as a caption when provided', () => {
    setup({ filename: 'example.ts' });

    expect(screen.getByText('example.ts')).toBeVisible();
  });

  it('omits the filename caption when not provided', () => {
    setup();

    expect(screen.queryByTestId('filename-caption')).not.toBeInTheDocument();
  });

  it('renders without a language, falling back to plain text', () => {
    setup({ code: 'plain text content', language: undefined });

    expect(screen.getByText('plain text content')).toBeVisible();
  });

  it('marks the requested line as highlighted', () => {
    setup({
      code: 'const a = 1;\nconst b = 2;',
      highlightedLines: [2],
    });

    const lines = screen.getAllByTestId('code-line');
    expect(lines).toHaveLength(2);
    // Which line is highlighted is driven entirely by the `highlightedLines`
    // input data, and there is no semantic/ARIA signal for "this line is
    // highlighted" — the class is the sole observable of that behaviour.
    expect(lines[0]).not.toHaveClass('bg-accent-muted');
    expect(lines[1]).toHaveClass('bg-accent-muted');
  });

  // #862 — the syntax highlighter must not paint its own hard-coded
  // background over the theme-aware `bg-surface-2` on the wrapping
  // `<figure>`, and its token colors must reference the theme-aware CSS
  // custom properties (`--code-*`, defined for both `:root` and `.dark` in
  // `index.css`) rather than oneDark's literal, always-dark HSL values.
  it('renders the code content with a transparent background so the theme-aware figure surface shows through', () => {
    setup();

    expect(screen.getByTestId('code-content')).toHaveStyle({
      background: 'transparent',
      color: 'var(--code-fg)',
    });
  });

  it('colors syntax tokens with theme-aware CSS custom properties, not literal hex/hsl values', () => {
    const { container } = setup();

    const keywordToken = Array.from(container.querySelectorAll('.token')).find(
      (token) => token.textContent === 'const',
    );

    expect(keywordToken).toHaveStyle({ color: 'var(--code-keyword)' });
  });
});
