import { render, screen } from '@admin/testing/custom-render';

import { Text } from './text';

describe(Text, () => {
  it('renders its content', () => {
    render(<Text>Every site on the platform.</Text>);
    expect(screen.getByText('Every site on the platform.')).toBeVisible();
  });

  it('defaults to the body variant as a <p>', () => {
    render(<Text>Body copy</Text>);
    const node = screen.getByText('Body copy');
    expect(node.tagName).toBe('P');
    expect(node).toHaveClass('text-admin-text');
  });

  it('applies the muted variant', () => {
    render(<Text variant="muted">Name</Text>);
    expect(screen.getByText('Name')).toHaveClass('text-admin-muted');
  });

  it('applies the supporting variant', () => {
    render(<Text variant="supporting">Every site on the platform.</Text>);
    expect(screen.getByText('Every site on the platform.')).toHaveClass(
      'text-admin-muted',
    );
  });

  it('applies the hint variant', () => {
    render(<Text variant="hint">northwind.dev</Text>);
    expect(screen.getByText('northwind.dev')).toHaveClass('text-admin-faint');
  });

  it('renders as a <span> when selected', () => {
    render(<Text as="span">Inline copy</Text>);
    expect(screen.getByText('Inline copy').tagName).toBe('SPAN');
  });

  it('merges a caller-supplied className', () => {
    render(<Text className="mt-1">Body copy</Text>);
    expect(screen.getByText('Body copy')).toHaveClass('mt-1');
  });
});
