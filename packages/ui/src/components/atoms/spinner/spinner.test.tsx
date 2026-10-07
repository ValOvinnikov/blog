import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Spinner } from './spinner';

faker.seed(123);

const label = faker.lorem.words(2);

const setup = customRender(Spinner, { label });

describe(`<${Spinner.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a status role with the label as its accessible name', () => {
      expect(screen.getByRole('status', { name: label })).toBeVisible();
    });

    it('does not render the label as visible text by default', () => {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    });

    it('hides the animated glyph from assistive tech', () => {
      const status = screen.getByRole('status', { name: label });
      const glyph = status.firstElementChild;
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('when hasLabel is true', () => {
    beforeEach(() => {
      setup({ hasLabel: true });
    });

    it('renders the label as visible text when hasLabel is true', () => {
      expect(screen.getByText(label)).toBeVisible();
    });

    it('hides the visible label text from assistive tech so it is not announced twice alongside the root aria-label', () => {
      expect(screen.getByText(label)).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'spinner' });
    expect(screen.getByTestId('spinner')).toBeVisible();
  });
});
