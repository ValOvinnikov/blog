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
  });

  it('renders as a <span> when selected', () => {
    render(<Text as="span">Inline copy</Text>);
    expect(screen.getByText('Inline copy').tagName).toBe('SPAN');
  });

  it('renders every variant without throwing', () => {
    const variants = ['body', 'muted', 'supporting', 'hint'] as const;
    for (const variant of variants) {
      expect(() =>
        render(<Text variant={variant}>Variant copy</Text>),
      ).not.toThrow();
    }
    expect(screen.getAllByText('Variant copy')).toHaveLength(variants.length);
  });

  it('merges a caller-supplied className', () => {
    render(<Text className="custom-class">Body copy</Text>);
    expect(screen.getByText('Body copy')).toHaveClass('custom-class');
  });
});
