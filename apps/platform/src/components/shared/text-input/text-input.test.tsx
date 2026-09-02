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

  it('makes the input read-only, not disabled, when isReadOnly is true', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <TextInput
        ariaLabel="Archived field"
        value="authored value"
        onChange={handleChange}
        isReadOnly={true}
      />,
    );

    const input = screen.getByLabelText('Archived field');
    expect(input).toHaveAttribute('readonly');
    expect(input).toBeEnabled();

    await user.type(input, 'x');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('does not forward hasExternalLabel to the rendered input', () => {
    render(<TextInput value="" onChange={vi.fn()} hasExternalLabel={true} />);

    expect(screen.getByRole('textbox')).not.toHaveAttribute('hasexternallabel');
  });
});
