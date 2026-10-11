import { TextInput } from '@platform/components/shared/text-input';
import { render, screen } from '@testing-library/react';

import { FormField } from './form-field';

describe(FormField, () => {
  it('names the control by its label', () => {
    render(
      <FormField label="Tenant name">
        <TextInput value="" onChange={vi.fn()} />
      </FormField>,
    );

    expect(screen.getByRole('textbox', { name: 'Tenant name' })).toBeVisible();
  });

  it('renders the label as a plain span when the control names itself', () => {
    render(
      <FormField label="Plan" control={{ hasOwnAccessibleName: true }}>
        <input aria-label="Plan" />
      </FormField>,
    );

    expect(screen.getByText('Plan').tagName).toBe('SPAN');
  });

  it('describes the control with its hint, then its error', () => {
    render(
      <FormField label="Slug" hint="Used in the URL" error="Already in use">
        <TextInput value="" onChange={vi.fn()} />
      </FormField>,
    );

    const input = screen.getByRole('textbox', { name: 'Slug' });
    expect(input).toHaveAccessibleDescription('Used in the URL Already in use');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('leaves the control undescribed and valid when there is no hint or error', () => {
    render(
      <FormField label="Slug">
        <TextInput value="" onChange={vi.fn()} />
      </FormField>,
    );

    const input = screen.getByRole('textbox', { name: 'Slug' });
    expect(input).toHaveAccessibleDescription('');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('gives two fields with the same label distinct controls', () => {
    render(
      <>
        <FormField label="Slug" error="Already in use">
          <TextInput value="" onChange={vi.fn()} />
        </FormField>
        <FormField label="Slug">
          <TextInput value="" onChange={vi.fn()} />
        </FormField>
      </>,
    );

    const [first, second] = screen.getAllByRole('textbox', { name: 'Slug' });
    expect(first).toHaveAccessibleDescription('Already in use');
    expect(second).toHaveAccessibleDescription('');
  });

  it('disables its control and describes it with an outside description before its hint', () => {
    render(
      <>
        <p id="archived-notice">This tenant is archived</p>
        <FormField
          label="Slug"
          hint="Used in the URL"
          control={{ isDisabled: true, describedBy: 'archived-notice' }}
        >
          <TextInput value="" onChange={vi.fn()} />
        </FormField>
      </>,
    );

    const input = screen.getByRole('textbox', { name: 'Slug' });
    expect(input).toBeDisabled();
    expect(input).toHaveAccessibleDescription(
      'This tenant is archived Used in the URL',
    );
  });

  it('gives its control the id it is given', () => {
    render(
      <FormField label="Slug" control={{ id: 'slug-field' }}>
        <TextInput value="" onChange={vi.fn()} />
      </FormField>,
    );

    expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveAttribute(
      'id',
      'slug-field',
    );
  });

  it('renders actions in the label row', () => {
    render(
      <FormField label="Subject" actions={<button type="button">Reset</button>}>
        <TextInput value="" onChange={vi.fn()} />
      </FormField>,
    );

    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Subject' })).toBeVisible();
  });

  it('renders footer content after the error message', () => {
    render(
      <FormField
        label="Owner email"
        error="Invalid email"
        footer={<span data-testid="footer">Confirmation sent</span>}
      >
        <TextInput value="" onChange={vi.fn()} />
      </FormField>,
    );

    expect(screen.getByTestId('footer')).toBeVisible();
  });
});
