import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CodeBlock } from './code-block';

describe('CodeBlock', () => {
  it('renders the code content', () => {
    const { container } = render(
      <CodeBlock code="const x = 1;" language="typescript" />,
    );

    expect(container.querySelector('pre')?.textContent).toBe('1const x = 1;');
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
    const { container } = render(
      <CodeBlock code="const x = 1;" language="typescript" />,
    );

    expect(container.querySelector('figcaption')).not.toBeInTheDocument();
  });

  it('renders without a language, falling back to plain text', () => {
    render(<CodeBlock code="plain text content" />);

    expect(screen.getByText('plain text content')).toBeVisible();
  });

  it('marks the requested line as highlighted', () => {
    const { container } = render(
      <CodeBlock
        code={'const a = 1;\nconst b = 2;'}
        language="typescript"
        highlightedLines={[2]}
      />,
    );

    const lines = container.querySelectorAll('pre > code > span');
    expect(lines).toHaveLength(2);
    expect(lines[0]).not.toHaveClass('bg-accent-muted');
    expect(lines[1]).toHaveClass('bg-accent-muted');
  });
});
