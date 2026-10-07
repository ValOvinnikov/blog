import { customRender } from '@blog/ui/testing/custom-render';

import { MetaSeparator } from './meta-separator';

const setup = customRender(MetaSeparator, {});

describe(`<${MetaSeparator.name}/>`, () => {
  describe('with the default props', () => {
    let container: HTMLElement;

    beforeEach(() => {
      ({ container } = setup());
    });

    it('renders the default · character', () => {
      expect(container.firstChild).toHaveTextContent('·');
    });

    it('has aria-hidden="true"', () => {
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('renders a custom separator', () => {
    const { container } = setup({ separator: '/' });
    expect(container.firstChild).toHaveTextContent('/');
  });
});
