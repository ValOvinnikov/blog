import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormTextInput } from './form-text-input';

describe(FormTextInput, () => {
  it('associates the label with the input via htmlFor/id', () => {
    render(
      <FormTextInput
        label="Tenant name"
        htmlFor="tenant-name"
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Tenant name')).toBeVisible();
  });

  it('renders the hint node and the error message', () => {
    render(
      <FormTextInput
        label="Slug"
        htmlFor="tenant-slug"
        hint={<span data-testid="hint">Used in the URL</span>}
        error="Already in use"
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('hint')).toBeVisible();
    expect(screen.getByText('Already in use')).toBeVisible();
  });

  it('renders footer content after the error message', () => {
    render(
      <FormTextInput
        label="Owner email"
        htmlFor="owner-email"
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
      <FormTextInput
        label="Tenant name"
        htmlFor="tenant-name"
        value=""
        onChange={handleChange}
      />,
    );

    await user.type(screen.getByLabelText('Tenant name'), 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('passes isInvalid, isDisabled and aria-describedby through to the input', () => {
    render(
      <FormTextInput
        label="Slug"
        htmlFor="tenant-slug"
        value=""
        onChange={vi.fn()}
        isInvalid={true}
        isDisabled={true}
        aria-describedby="tenant-slug-lock-reason"
      />,
    );

    const input = screen.getByLabelText('Slug');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'tenant-slug-lock-reason',
    );
  });
});
