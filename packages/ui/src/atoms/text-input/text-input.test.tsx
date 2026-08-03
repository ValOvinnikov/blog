import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { TextInput } from './text-input';

faker.seed(123);

const setup = customRender(TextInput, {
  value: '',
  onChange: vi.fn(),
  ariaLabel: 'Email address',
});

describe(`<${TextInput.name}/>`, () => {
  it('renders a textbox with the given ariaLabel', () => {
    setup();
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });

  it('renders the controlled value', () => {
    const value = faker.internet.email();
    setup({ value });
    expect(screen.getByRole('textbox')).toHaveValue(value);
  });

  it('calls onChange with the new value on input, and does not manage its own state', async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('has no leading prompt glyph by default', () => {
    setup();
    expect(screen.queryByText('$')).not.toBeInTheDocument();
  });

  it('renders a decorative leading prompt glyph when given, hidden from the accessibility tree', () => {
    setup({ prompt: '$' });
    const prompt = screen.getByText('$');
    expect(prompt).toBeVisible();
    expect(prompt).toHaveAttribute('aria-hidden', 'true');
  });

  it('is not marked invalid by default', () => {
    setup();
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  });

  it('marks the field invalid via aria-invalid when invalid is true', () => {
    setup({ invalid: true });
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'text-input' });
    expect(screen.getByTestId('text-input')).toBeVisible();
  });

  it('accepts a className override on the root', () => {
    const { container } = setup({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
