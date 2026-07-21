import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { InlineCode } from './inline-code';

faker.seed(123);

describe(`<${InlineCode.name}/>`, () => {
  it('renders a code element', () => {
    const token = faker.hacker.noun();
    render(<InlineCode>{token}</InlineCode>);
    expect(screen.getByText(token).tagName).toBe('CODE');
  });

  it('forwards a custom className alongside its own styling', () => {
    const token = faker.hacker.noun();
    render(<InlineCode className="extra-class">{token}</InlineCode>);
    expect(screen.getByText(token).className).toContain('extra-class');
  });

  it('applies inline code styling', () => {
    const token = faker.hacker.noun();
    render(<InlineCode>{token}</InlineCode>);
    expect(screen.getByText(token).className).toContain('font-mono');
  });

  it('forwards dataTestId as a data-testid attribute', () => {
    render(<InlineCode dataTestId="inline-code">token</InlineCode>);
    expect(screen.getByTestId('inline-code')).toBeVisible();
  });
});
