import { render, screen } from '@testing-library/react';

import { Text } from './text';

describe(`<${Text.name}/>`, () => {
  it('renders children as a paragraph', () => {
    render(<Text>Body text</Text>);
    expect(screen.getByText('Body text').tagName).toBe('P');
  });

  it('renders with default lead variant when no variant is given', () => {
    render(<Text>Default</Text>);
    expect(screen.getByText('Default').className).toContain('text-text');
  });

  it('hero variant applies muted color', () => {
    render(<Text variant="hero">Subtitle</Text>);
    expect(screen.getByText('Subtitle').className).toContain('text-muted');
  });

  it('card variant applies card-copy size', () => {
    render(<Text variant="card">Excerpt</Text>);
    expect(screen.getByText('Excerpt').className).toContain('text-card-copy');
  });

  it('muted variant applies muted color', () => {
    render(<Text variant="muted">Muted body</Text>);
    expect(screen.getByText('Muted body').className).toContain('text-muted');
  });

  it('lead variant applies text-text color', () => {
    render(<Text variant="lead">Lead body</Text>);
    expect(screen.getByText('Lead body').className).toContain('text-text');
  });

  it('accepts className override', () => {
    render(<Text className="max-w-prose">Body</Text>);
    expect(screen.getByText('Body').className).toContain('max-w-prose');
  });

  it('forwards additional HTML attributes', () => {
    render(<Text data-testid="text-el">Content</Text>);
    expect(screen.getByTestId('text-el')).toBeVisible();
  });
});
