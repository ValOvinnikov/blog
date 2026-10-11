import { FormField } from '@platform/components/shared/form-field';
import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { Textarea } from './textarea';

describe(Textarea, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the given value', () => {
    render(
      <FormField label="Notes">
        <Textarea value="Hello" onChange={vi.fn()} />
      </FormField>,
    );

    expect(screen.getByLabelText('Notes')).toHaveValue('Hello');
  });

  it('calls onChange with the new string value on input', async () => {
    const handleChange = vi.fn();

    render(
      <FormField label="Notes">
        <Textarea value="" onChange={handleChange} />
      </FormField>,
    );

    await user.type(screen.getByLabelText('Notes'), 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('passes rows and placeholder through to the textarea', () => {
    render(
      <FormField label="Bio">
        <Textarea
          value=""
          onChange={vi.fn()}
          rows={6}
          placeholder="Inherited from preset"
        />
      </FormField>,
    );

    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toHaveAttribute('rows', '6');
    expect(textarea).toHaveAttribute('placeholder', 'Inherited from preset');
  });

  it('is disabled when the field it sits in is disabled', () => {
    render(
      <FormField label="Locked field" control={{ isDisabled: true }}>
        <Textarea value="inherited value" onChange={vi.fn()} />
      </FormField>,
    );

    expect(screen.getByLabelText('Locked field')).toBeDisabled();
  });

  it('makes the textarea read-only, not disabled, when isReadOnly is true', async () => {
    const handleChange = vi.fn();
    render(
      <FormField label="Archived field">
        <Textarea
          value="authored value"
          onChange={handleChange}
          isReadOnly={true}
        />
      </FormField>,
    );

    const textarea = screen.getByLabelText('Archived field');
    expect(textarea).toHaveAttribute('readonly');
    expect(textarea).toBeEnabled();

    await user.type(textarea, 'x');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('is marked invalid and described by the error of the field it sits in', () => {
    render(
      <FormField label="Bio" error="Too long">
        <Textarea value="" onChange={vi.fn()} />
      </FormField>,
    );

    const textarea = screen.getByRole('textbox', { name: 'Bio' });
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription('Too long');
  });
});
