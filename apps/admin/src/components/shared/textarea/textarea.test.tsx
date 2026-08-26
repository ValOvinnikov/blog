import { render, screen } from '@admin/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { Textarea } from './textarea';

describe(Textarea, () => {
  it('renders the given value', () => {
    render(<Textarea ariaLabel="Notes" value="Hello" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Notes')).toHaveValue('Hello');
  });

  it('calls onChange with the new string value on input', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Textarea ariaLabel="Notes" value="" onChange={handleChange} />);

    await user.type(screen.getByLabelText('Notes'), 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('passes rows, maxLength and placeholder through to the textarea', () => {
    render(
      <Textarea
        ariaLabel="Bio"
        value=""
        onChange={vi.fn()}
        rows={6}
        maxLength={200}
        placeholder="Inherited from preset"
      />,
    );

    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toHaveAttribute('rows', '6');
    expect(textarea).toHaveAttribute('maxlength', '200');
    expect(textarea).toHaveAttribute('placeholder', 'Inherited from preset');
  });

  it('disables the textarea when isDisabled is true', () => {
    render(
      <Textarea
        ariaLabel="Locked field"
        value="inherited value"
        onChange={vi.fn()}
        isDisabled={true}
      />,
    );

    expect(screen.getByLabelText('Locked field')).toBeDisabled();
  });
});
