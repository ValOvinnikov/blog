import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { Textarea } from './textarea';

faker.seed(123);

const setup = customRender(Textarea, {
  value: '',
  onChange: vi.fn(),
  ariaLabel: 'Comment body',
});

describe(`<${Textarea.name}/>`, () => {
  it('renders a textbox with the given ariaLabel', () => {
    setup();
    expect(screen.getByRole('textbox', { name: 'Comment body' })).toBeVisible();
  });

  it('renders the controlled value', () => {
    const value = faker.lorem.sentence();
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

  it('forwards rows to the native textarea', () => {
    setup({ rows: 6 });
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '6');
  });

  it('forwards maxLength to the native textarea', () => {
    setup({ maxLength: 280 });
    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '280');
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

  it('marks the field invalid via aria-invalid when isInvalid is true', () => {
    setup({ isInvalid: true });
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'textarea' });
    expect(screen.getByTestId('textarea')).toBeVisible();
  });

  it('accepts a className override on the root', () => {
    const { container } = setup({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('is not disabled by default', () => {
    setup();
    expect(screen.getByRole('textbox')).toBeEnabled();
  });

  it('renders the native disabled attribute when isDisabled is true', () => {
    setup({ isDisabled: true });
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('keeps the error border when both isInvalid and isDisabled are true', () => {
    setup({ isInvalid: true, isDisabled: true });
    // sole observable of the disabled-state border-color override winning over the invalid one
    expect(screen.getByRole('textbox')).toHaveClass('disabled:border-error');
  });
});
