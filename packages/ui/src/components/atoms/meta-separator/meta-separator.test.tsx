import { customRender } from '@blog/ui/testing/custom-render';

import { MetaSeparator } from './meta-separator';

const setup = customRender(MetaSeparator, {});

describe(`<${MetaSeparator.name}/>`, () => {
  it('renders the default · character', () => {
    const { container } = setup();
    expect(container.firstChild).toHaveTextContent('·');
  });

  it('renders a custom separator', () => {
    const { container } = setup({ separator: '/' });
    expect(container.firstChild).toHaveTextContent('/');
  });

  it('has aria-hidden="true"', () => {
    const { container } = setup();
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
