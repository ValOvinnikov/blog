import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { TextInput } from './text-input';

describe(TextInput, () => {
  it('renders the given value', () => {
    render(
      <TextInput ariaLabel="Tenant name" value="Acme" onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText('Tenant name')).toHaveValue('Acme');
  });

  it('calls onChange with the new string value on input', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <TextInput ariaLabel="Tenant name" value="" onChange={handleChange} />,
    );

    await user.type(screen.getByLabelText('Tenant name'), 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('disables the input when isDisabled is true', () => {
    render(
      <TextInput
        ariaLabel="Slug"
        value="locked-slug"
        onChange={vi.fn()}
        isDisabled={true}
      />,
    );

    const input = screen.getByLabelText('Slug');
    expect(input).toBeDisabled();
  });
});
