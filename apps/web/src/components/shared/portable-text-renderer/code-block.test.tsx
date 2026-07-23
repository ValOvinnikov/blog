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
    expect(lines[0]).not.toHaveClass('bg-accent-muted');
    expect(lines[1]).toHaveClass('bg-accent-muted');
  });
});
