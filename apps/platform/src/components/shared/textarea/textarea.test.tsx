import { faker } from '@faker-js/faker';
import { FormField } from '@platform/components/shared/form-field';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { Textarea, type TTextareaProps } from './textarea';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_VALUE = faker.lorem.sentence();
const MOCK_PLACEHOLDER = faker.lorem.sentence();
const MOCK_ERROR = faker.lorem.sentence();
const MOCK_ROWS = 6;

type TTextareaFieldProps = TTextareaProps & {
  field?: Omit<ComponentProps<typeof FormField>, 'label' | 'children'>;
};

const TextareaField = ({ field, ...props }: TTextareaFieldProps) => (
  <FormField label={MOCK_LABEL} {...field}>
    <Textarea {...props} />
  </FormField>
);

const setup = customRender(TextareaField, { value: '', onChange: vi.fn() });

describe(`<${Textarea.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the given value', () => {
    setup({ value: MOCK_VALUE });

    const textarea = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(textarea).toHaveValue(MOCK_VALUE);
  });

  it('calls onChange with the new string value on input', async () => {
    const handleChange = vi.fn();
    setup({ onChange: handleChange });

    const textarea = screen.getByRole('textbox', { name: MOCK_LABEL });
    await user.type(textarea, 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('passes rows and placeholder through to the textarea', () => {
    setup({ rows: MOCK_ROWS, placeholder: MOCK_PLACEHOLDER });

    const textarea = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(textarea).toHaveAttribute('rows', String(MOCK_ROWS));
    expect(textarea).toHaveAttribute('placeholder', MOCK_PLACEHOLDER);
  });

  it('is disabled when the field it sits in is disabled', () => {
    setup({ value: MOCK_VALUE, field: { control: { isDisabled: true } } });

    const textarea = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(textarea).toBeDisabled();
  });

  it('is read-only, not disabled, when marked read-only', async () => {
    const handleChange = vi.fn();
    setup({ value: MOCK_VALUE, onChange: handleChange, isReadOnly: true });

    const textarea = screen.getByRole('textbox', { name: MOCK_LABEL });
    await user.type(textarea, 'x');

    expect(textarea).toHaveAttribute('readonly');
    expect(textarea).toBeEnabled();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('is marked invalid and described by the error of the field it sits in', () => {
    setup({ field: { error: MOCK_ERROR } });

    const textarea = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(textarea).toBeInvalid();
    expect(textarea).toHaveAccessibleDescription(MOCK_ERROR);
  });
});
