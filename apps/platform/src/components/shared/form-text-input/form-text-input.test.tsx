import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormTextInput } from './form-text-input';

describe(FormTextInput, () => {
  it('names the input by its label', () => {
    render(<FormTextInput label="Tenant name" value="" onChange={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: 'Tenant name' });
    expect(input).toBeVisible();
    expect(input).not.toHaveAttribute('aria-label');
  });

  it('describes the input with its hint and error', () => {
    render(
      <FormTextInput
        label="Slug"
        hint={<span data-testid="hint">Used in the URL</span>}
        error="Already in use"
        value=""
        onChange={vi.fn()}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Slug' });
    expect(input).toHaveAccessibleDescription('Used in the URL Already in use');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders footer content after the error message', () => {
    render(
      <FormTextInput
        label="Owner email"
        error="Invalid email"
        footer={<span data-testid="footer">Confirmation sent</span>}
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('footer')).toBeVisible();
  });

  it('calls onChange with the typed value', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <FormTextInput label="Tenant name" value="" onChange={handleChange} />,
    );

    await user.type(screen.getByLabelText('Tenant name'), 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('disables the input and keeps an outside description alongside its hint', () => {
    render(
      <>
        <p id="archived-notice">This tenant is archived</p>
        <FormTextInput
          label="Slug"
          hint="Used in the URL"
          value=""
          onChange={vi.fn()}
          isDisabled={true}
          aria-describedby="archived-notice"
        />
      </>,
    );

    const input = screen.getByRole('textbox', { name: 'Slug' });
    expect(input).toBeDisabled();
    expect(input).toHaveAccessibleDescription(
      'This tenant is archived Used in the URL',
    );
  });
});
