import { render, screen } from '@testing-library/react';

import { FormField } from './form-field';

describe(FormField, () => {
  it('associates the label with the control via htmlFor', () => {
    render(
      <FormField label="Tenant name" htmlFor="tenant-name">
        <input id="tenant-name" />
      </FormField>,
    );

    expect(screen.getByLabelText('Tenant name')).toBeVisible();
  });

  it('renders a plain label-styled span when htmlFor is omitted', () => {
    render(
      <FormField label="Plan">
        <input aria-label="Plan" />
      </FormField>,
    );

    expect(screen.getByText('Plan').tagName).toBe('SPAN');
  });

  it('renders the hint node between the control and the error message', () => {
    render(
      <FormField
        label="Slug"
        htmlFor="tenant-slug"
        hint={<span data-testid="hint">Used in the URL</span>}
        error="Already in use"
      >
        <input id="tenant-slug" />
      </FormField>,
    );

    expect(screen.getByTestId('hint')).toBeVisible();
    expect(screen.getByText('Already in use')).toBeVisible();
  });

  it('omits the error message and its id when there is no error', () => {
    render(
      <FormField label="Slug" htmlFor="tenant-slug">
        <input id="tenant-slug" />
      </FormField>,
    );

    expect(
      document.getElementById('tenant-slug-error'),
    ).not.toBeInTheDocument();
  });

  it('renders the error with a predictable id derived from htmlFor, for aria-describedby wiring', () => {
    render(
      <FormField label="Slug" htmlFor="tenant-slug" error="Already in use">
        <input id="tenant-slug" aria-describedby="tenant-slug-error" />
      </FormField>,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAccessibleDescription('Already in use');
  });

  it('renders footer content after the error message', () => {
    render(
      <FormField
        label="Owner email"
        htmlFor="owner-email"
        error="Invalid email"
        footer={<span data-testid="footer">Confirmation sent</span>}
      >
        <input id="owner-email" />
      </FormField>,
    );

    expect(screen.getByTestId('footer')).toBeVisible();
  });
});
