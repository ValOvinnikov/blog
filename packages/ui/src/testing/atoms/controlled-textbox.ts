import type { TTextareaProps } from '@blog/ui/components/atoms/textarea/textarea';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ComponentType } from 'react';

type TControlledTextboxProps = Pick<
  TTextareaProps,
  'value' | 'onChange' | 'ariaLabel' | 'isDisabled'
>;

export const itActsAsAControlledTextbox = (
  Field: ComponentType<TControlledTextboxProps>,
): void => {
  const MOCK_ARIA_LABEL = faker.lorem.words(2);
  const MOCK_VALUE = faker.lorem.sentence();
  const MOCK_TYPED_CHARACTER = faker.string.alpha(1);

  const setup = customRender(Field, {
    value: '',
    onChange: vi.fn(),
    ariaLabel: MOCK_ARIA_LABEL,
  });

  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders a textbox named by the ariaLabel', () => {
    setup();

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toBeVisible();
  });

  it('renders the controlled value', () => {
    setup({ value: MOCK_VALUE });

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toHaveValue(MOCK_VALUE);
  });

  it('reports typed input without keeping its own state', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });
    await user.type(textbox, MOCK_TYPED_CHARACTER);

    expect(onChange).toHaveBeenCalledWith(MOCK_TYPED_CHARACTER);
    expect(textbox).toHaveValue('');
  });

  it('disables the field when isDisabled is true', () => {
    setup({ isDisabled: true });

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toBeDisabled();
  });
};
