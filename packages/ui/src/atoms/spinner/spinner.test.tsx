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

  it('renders the label as visible text when showLabel is true', () => {
    setup({ showLabel: true });
    expect(screen.getByText(label)).toBeVisible();
  });

  it('hides the visible label text from assistive tech so it is not announced twice alongside the root aria-label', () => {
    setup({ showLabel: true });
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
    setup({ className: 'text-accent-contrast' });
    expect(screen.getByRole('status', { name: label })).toHaveClass(
      'text-accent-contrast',
    );
  });

  it('lets a className color override cascade to the glyph, which sets no color of its own', () => {
    setup({ className: 'text-accent-contrast' });
    const status = screen.getByRole('status', { name: label });
    const glyph = status.firstElementChild;
    expect(glyph).not.toHaveClass('text-accent', 'text-accent-contrast');
  });
});
