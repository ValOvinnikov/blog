import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { QuoteBlock } from './quote-block';

faker.seed(123);

describe(`<${QuoteBlock.name}/>`, () => {
  it('renders a blockquote with the given children', () => {
    const quote = faker.lorem.sentence();
    render(<QuoteBlock>{quote}</QuoteBlock>);
    expect(screen.getByText(quote)).toBeVisible();
    expect(screen.getByText(quote).tagName).toBe('BLOCKQUOTE');
  });

  it('applies the accent-muted border and italic treatment classes', () => {
    const quote = faker.lorem.sentence();
    render(<QuoteBlock>{quote}</QuoteBlock>);
    const element = screen.getByText(quote);
    expect(element.className).toContain('border-accent-muted');
    expect(element.className).toContain('italic');
    expect(element.className).toContain('font-read');
  });

  it('forwards data-testid', () => {
    const quote = faker.lorem.sentence();
    render(<QuoteBlock dataTestId="quote-block">{quote}</QuoteBlock>);
    expect(screen.getByTestId('quote-block')).toBeVisible();
  });

  it('merges extra className', () => {
    const quote = faker.lorem.sentence();
    render(<QuoteBlock className="ml-2">{quote}</QuoteBlock>);
    expect(screen.getByText(quote).className).toContain('ml-2');
  });
});
