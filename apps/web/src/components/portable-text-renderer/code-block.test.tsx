import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CodeBlock } from './code-block';

describe(`<${CodeBlock.name}/>`, () => {
  it('renders the code content', () => {
    render(<CodeBlock code="const x = 1;" language="typescript" />);

    expect(screen.getByTestId('code-content').textContent).toBe(
      '1const x = 1;',
    );
  });

  it('renders the filename as a caption when provided', () => {
    render(
      <CodeBlock
        code="const x = 1;"
        language="typescript"
        filename="example.ts"
      />,
    );

    expect(screen.getByText('example.ts')).toBeVisible();
  });

  it('omits the filename caption when not provided', () => {
    render(<CodeBlock code="const x = 1;" language="typescript" />);

    expect(screen.queryByTestId('filename-caption')).not.toBeInTheDocument();
  });

  it('renders without a language, falling back to plain text', () => {
    render(<CodeBlock code="plain text content" />);

    expect(screen.getByText('plain text content')).toBeVisible();
  });

  it('marks the requested line as highlighted', () => {
    render(
      <CodeBlock
        code={'const a = 1;\nconst b = 2;'}
        language="typescript"
        highlightedLines={[2]}
      />,
    );

    const lines = screen.getAllByTestId('code-line');
    expect(lines).toHaveLength(2);
    expect(lines[0]).not.toHaveClass('bg-accent-muted');
    expect(lines[1]).toHaveClass('bg-accent-muted');
  });
});
