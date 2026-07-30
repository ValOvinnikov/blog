import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { QuoteBlock } from './quote-block';

faker.seed(123);

const setup = customRender(QuoteBlock, {
  children: faker.lorem.sentence(),
});

describe(`<${QuoteBlock.name}/>`, () => {
  it('renders a blockquote with the given children', () => {
    const quote = faker.lorem.sentence();
    setup({ children: quote });
    expect(screen.getByText(quote)).toBeVisible();
    expect(screen.getByText(quote).tagName).toBe('BLOCKQUOTE');
  });

  it('forwards data-testid', () => {
    const quote = faker.lorem.sentence();
    setup({ children: quote, dataTestId: 'quote-block' });
    expect(screen.getByTestId('quote-block')).toBeVisible();
  });

  it('merges extra className', () => {
    const quote = faker.lorem.sentence();
    setup({ children: quote, className: 'custom-class' });
    expect(screen.getByText(quote).className).toContain('custom-class');
  });
});
