import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Spinner } from './spinner';

faker.seed(123);

const label = faker.lorem.words(2);

const setup = customRender(Spinner, { label });

describe(`<${Spinner.name}/>`, () => {
  it('renders a status role with the label as its accessible name', () => {
    setup();
    expect(screen.getByRole('status', { name: label })).toBeVisible();
  });

  it('does not render the label as visible text by default', () => {
    setup();
    expect(screen.queryByText(label)).not.toBeInTheDocument();
  });

  it('renders the label as visible text when hasLabel is true', () => {
    setup({ hasLabel: true });
    expect(screen.getByText(label)).toBeVisible();
  });

  it('hides the visible label text from assistive tech so it is not announced twice alongside the root aria-label', () => {
    setup({ hasLabel: true });
    expect(screen.getByText(label)).toHaveAttribute('aria-hidden', 'true');
  });

  it('hides the animated glyph from assistive tech', () => {
    setup();
    const status = screen.getByRole('status', { name: label });
    const glyph = status.firstElementChild;
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'spinner' });
    expect(screen.getByTestId('spinner')).toBeVisible();
  });

  it('accepts a className override on the root', () => {
    setup({ className: 'custom-class' });
    expect(screen.getByRole('status', { name: label })).toHaveClass(
      'custom-class',
    );
  });

  it('does not forward a className override on the root to the glyph, so the glyph always inherits its color from the root', () => {
    setup({ className: 'custom-class' });
    const status = screen.getByRole('status', { name: label });
    const glyph = status.firstElementChild;
    expect(glyph).not.toHaveClass('custom-class');
  });
});
