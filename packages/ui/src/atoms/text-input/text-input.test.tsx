import { ICONS, Size } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
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

  it('has no leading icon glyph by default', () => {
    setup();
    expect(screen.queryByText('$')).not.toBeInTheDocument();
  });

  it('renders a decorative leading icon glyph when given, hidden from the accessibility tree', () => {
    setup({ leadingIcon: '$' });
    const leadingIcon = screen.getByText('$');
    expect(leadingIcon).toBeVisible();
    expect(leadingIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders a non-string ReactNode leadingIcon, such as an icon', () => {
    setup({
      leadingIcon: (
        <Icon
          name={ICONS.CHEVRON_RIGHT}
          size={Size.SM}
          dataTestId="leading-icon"
        />
      ),
    });
    expect(screen.getByTestId('leading-icon')).toBeVisible();
  });

  it('has no trailing icon glyph by default', () => {
    setup();
    expect(screen.queryByText('$')).not.toBeInTheDocument();
  });

  it('renders a decorative trailing icon glyph when given, hidden from the accessibility tree, positioned after the input', () => {
    setup({ trailingIcon: '$' });
    const trailingIcon = screen.getByText('$');
    expect(trailingIcon).toBeVisible();
    expect(trailingIcon).toHaveAttribute('aria-hidden', 'true');
    const input = screen.getByRole('textbox');
    expect(
      input.compareDocumentPosition(trailingIcon) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders a non-string ReactNode trailingIcon, such as an icon', () => {
    setup({
      trailingIcon: (
        <Icon
          name={ICONS.CHEVRON_RIGHT}
          size={Size.SM}
          dataTestId="trailing-icon"
        />
      ),
    });
    expect(screen.getByTestId('trailing-icon')).toBeVisible();
  });

  it('renders both leadingIcon and trailingIcon together, each in its own position', () => {
    setup({ leadingIcon: '$', trailingIcon: '#' });
    const leadingIcon = screen.getByText('$');
    const trailingIcon = screen.getByText('#');
    expect(leadingIcon).toBeVisible();
    expect(trailingIcon).toBeVisible();
    const input = screen.getByRole('textbox');
    expect(
      leadingIcon.compareDocumentPosition(input) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      input.compareDocumentPosition(trailingIcon) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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
    setup({ dataTestId: 'text-input' });
    expect(screen.getByTestId('text-input')).toBeVisible();
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
