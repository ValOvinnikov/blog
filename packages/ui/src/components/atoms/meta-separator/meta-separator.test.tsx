import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { MetaSeparator } from './meta-separator';

faker.seed(123);

const MOCK_SEPARATOR = faker.string.symbol(1);

const setup = customRender(MetaSeparator, { separator: MOCK_SEPARATOR });

describe(`<${MetaSeparator.name}/>`, () => {
  it('renders the given separator', () => {
    setup();

    const separator = screen.getByText(MOCK_SEPARATOR);

    expect(separator).toBeInTheDocument();
  });

  it('hides the separator from assistive tech', () => {
    setup();

    const separator = screen.getByText(MOCK_SEPARATOR);

    expect(separator).toHaveAttribute('aria-hidden', 'true');
  });
});
