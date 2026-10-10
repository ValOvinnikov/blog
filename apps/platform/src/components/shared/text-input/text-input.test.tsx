import { FormField } from '@platform/components/shared/form-field';
import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { TextInput } from './text-input';

describe(TextInput, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the given value', () => {
    render(
      <FormField label="Tenant name">
        <TextInput value="Acme" onChange={vi.fn()} />
      </FormField>,
    );

    expect(screen.getByLabelText('Tenant name')).toHaveValue('Acme');
  });

  it('calls onChange with the new string value on input', async () => {
    const handleChange = vi.fn();

    render(
      <FormField label="Tenant name">
        <TextInput value="" onChange={handleChange} />
      </FormField>,
    );

    await user.type(screen.getByLabelText('Tenant name'), 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('is disabled when the field it sits in is disabled', () => {
    render(
      <FormField label="Slug" control={{ isDisabled: true }}>
        <TextInput value="locked-slug" onChange={vi.fn()} />
      </FormField>,
    );

    expect(screen.getByLabelText('Slug')).toBeDisabled();
  });

  it('makes the input read-only, not disabled, when isReadOnly is true', async () => {
    const handleChange = vi.fn();
    render(
      <FormField label="Archived field">
        <TextInput
          value="authored value"
          onChange={handleChange}
          isReadOnly={true}
        />
      </FormField>,
    );

    const input = screen.getByLabelText('Archived field');
    expect(input).toHaveAttribute('readonly');
    expect(input).toBeEnabled();

    await user.type(input, 'x');
    expect(handleChange).not.toHaveBeenCalled();
  });
});
