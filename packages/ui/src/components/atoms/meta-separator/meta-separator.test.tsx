import { faker } from '@faker-js/faker';
import { ARIA_HIDDEN } from '@shinefold/ui/testing/aria';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';

import { MetaSeparator } from './meta-separator';

faker.seed(123);

const MOCK_SEPARATOR = faker.string.symbol(1);

const setup = customRender(MetaSeparator, { separator: MOCK_SEPARATOR });

describe(`<${MetaSeparator.name}/>`, () => {
  let separator: HTMLElement;

  beforeEach(() => {
    setup();
    separator = screen.getByText(MOCK_SEPARATOR);
  });

  it('renders the given separator', () => {
    expect(separator).toBeVisible();
  });

  it('hides the separator from assistive tech', () => {
    expect(separator).toHaveAttribute(ARIA_HIDDEN, 'true');
  });
});
