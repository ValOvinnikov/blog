import { faker } from '@faker-js/faker';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';

import { QuoteBlock } from './quote-block';

faker.seed(123);

const MOCK_QUOTE = faker.lorem.sentence();

const setup = customRender(QuoteBlock, {
  children: MOCK_QUOTE,
});

describe(`<${QuoteBlock.name}/>`, () => {
  it('renders the given children as a blockquote', () => {
    setup();

    const blockquote = screen.getByRole('blockquote');

    expect(blockquote).toHaveTextContent(MOCK_QUOTE);
  });
});
