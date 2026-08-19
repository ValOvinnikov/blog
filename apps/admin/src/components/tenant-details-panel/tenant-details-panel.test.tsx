import { renderWithIntl, screen, waitFor } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';
import { TENANT_PLAN } from '@blog/db';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { TenantDetailsPanel } from './tenant-details-panel';

const render = renderWithIntl;

const { updateTenantDetailsActionMock } = vi.hoisted(() => ({
  updateTenantDetailsActionMock: vi.fn(),
}));

vi.mock('@admin/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: updateTenantDetailsActionMock,
}));

describe(TenantDetailsPanel, () => {
  const refreshMock = vi.fn();

  beforeEach(() => {
    updateTenantDetailsActionMock.mockReset();
    refreshMock.mockReset();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: refreshMock,
    });
  });

  describe('locked (isEditable=false)', () => {
    function getLockedValue(labelText: string) {
      const term = screen.getByText(labelText);
      expect(term.tagName).toBe('DT');
      const value = term.nextElementSibling;
      expect(value?.tagName).toBe('DD');
      return value as HTMLElement;
    }

    it('renders every field, including plan, as selectable text carrying its label — not a disabled input', () => {
      const tenant = makeTenant({
        name: 'Acme Inc.',
        slug: 'acme',
        primaryDomain: 'acme.example.com',
        plan: TENANT_PLAN.GROWTH,
        locale: 'EN',
      });
      render(<TenantDetailsPanel tenant={tenant} isEditable={false} />);

      expect(screen.getByText('Tenant details')).toBeVisible();

      // No disabled inputs remain in the accessibility tree at all — a
      // regression to disabled TextInputs would still surface here, since
      // getByRole finds disabled controls unless they're aria-hidden.
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      const nameValue = getLockedValue('Name');
      expect(nameValue).toHaveTextContent('Acme Inc.');
      expect(nameValue.closest('dl')).toBeInTheDocument();

      expect(getLockedValue('Slug')).toHaveTextContent('acme');
      expect(getLockedValue('Primary domain')).toHaveTextContent(
        'acme.example.com',
      );
      expect(getLockedValue('Locale')).toHaveTextContent('EN');

      // The human-readable plan label, not the raw TENANT_PLAN constant.
      const planValue = getLockedValue('Plan');
      expect(planValue).toHaveTextContent('Growth');
      expect(planValue).not.toHaveTextContent('GROWTH');
    });

    it('renders no enabled editing affordances — no Save button, no editable plan control', () => {
      const tenant = makeTenant();
      render(<TenantDetailsPanel tenant={tenant} isEditable={false} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('editable (isEditable=true)', () => {
    it('renders every field as an editable, enabled control, pre-filled from the tenant', () => {
      const tenant = makeTenant({
        name: 'Acme Inc.',
        slug: 'acme',
        primaryDomain: 'acme.example.com',
        plan: TENANT_PLAN.FREE,
        locale: 'EN',
      });
      render(<TenantDetailsPanel tenant={tenant} isEditable={true} />);

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      expect(nameInput).toHaveValue('Acme Inc.');
      expect(nameInput).not.toBeDisabled();

      expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveValue('acme');
      expect(
        screen.getByRole('textbox', { name: 'Primary domain' }),
      ).toHaveValue('acme.example.com');
      expect(screen.getByRole('radio', { name: 'Free' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.getByRole('textbox', { name: 'Locale' })).toHaveValue('EN');
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeVisible();
    });

    it('saves the edited values and refreshes on success', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: true,
        tenant: makeTenant({ name: 'Acme Renamed' }),
      });
      const user = userEvent.setup();
      const tenant = makeTenant({ id: 'tenant-1', name: 'Acme Inc.' });
      render(<TenantDetailsPanel tenant={tenant} isEditable={true} />);

      await user.clear(screen.getByRole('textbox', { name: 'Name' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Name' }),
        'Acme Renamed',
      );
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({ name: 'Acme Renamed' }),
        );
      });
      await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    });

    it('shows a field error and does not refresh when saving fails', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        fieldErrors: { slug: 'This slug is already in use.' },
      });
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(<TenantDetailsPanel tenant={tenant} isEditable={true} />);

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(
        await screen.findByText('This slug is already in use.'),
      ).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("associates a field's error with its input via aria-invalid and aria-describedby", async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        fieldErrors: {
          name: 'Enter a tenant name.',
          primaryDomain: 'Enter a valid domain.',
        },
      });
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(<TenantDetailsPanel tenant={tenant} isEditable={true} />);

      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      await screen.findByText('Enter a tenant name.');

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      expect(nameInput).toBeInvalid();
      expect(nameInput).toHaveAccessibleDescription('Enter a tenant name.');

      const domainInput = screen.getByRole('textbox', {
        name: 'Primary domain',
      });
      expect(domainInput).toBeInvalid();
      expect(domainInput).toHaveAccessibleDescription('Enter a valid domain.');

      // Fields with no error of their own stay valid and undescribed.
      const slugInput = screen.getByRole('textbox', { name: 'Slug' });
      expect(slugInput).not.toBeInvalid();
      expect(slugInput).toHaveAccessibleDescription('');
    });

    it('shows the form-level provisioning-started error and does not refresh, without a successful save', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        error:
          "This tenant's provisioning has already started; its details can no longer be edited.",
      });
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(<TenantDetailsPanel tenant={tenant} isEditable={true} />);

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(
        await screen.findByText(
          "This tenant's provisioning has already started; its details can no longer be edited.",
        ),
      ).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });
  });
});
