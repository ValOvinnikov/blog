import { renderWithIntl, screen, waitFor } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';
import { TENANT_PLAN } from '@blog/config';
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

  describe('locked (editable=false)', () => {
    it('renders every tenant detail read-only', () => {
      const tenant = makeTenant({
        name: 'Acme Inc.',
        slug: 'acme',
        primaryDomain: 'acme.example.com',
        plan: TENANT_PLAN.GROWTH,
        locale: 'EN',
      });
      render(<TenantDetailsPanel tenant={tenant} editable={false} />);

      expect(screen.getByText('Tenant details')).toBeVisible();
      expect(screen.getByText('Acme Inc.')).toBeVisible();
      expect(screen.getByText('acme')).toBeVisible();
      expect(screen.getByText('acme.example.com')).toBeVisible();
      expect(screen.getByText('Growth')).toBeVisible();
      expect(screen.getByText('EN')).toBeVisible();
    });

    it('renders no editable controls', () => {
      const tenant = makeTenant();
      render(<TenantDetailsPanel tenant={tenant} editable={false} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('editable (editable=true)', () => {
    it('renders every field as an editable control, pre-filled from the tenant', () => {
      const tenant = makeTenant({
        name: 'Acme Inc.',
        slug: 'acme',
        primaryDomain: 'acme.example.com',
        plan: TENANT_PLAN.FREE,
        locale: 'EN',
      });
      render(<TenantDetailsPanel tenant={tenant} editable={true} />);

      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Acme Inc.',
      );
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
      render(<TenantDetailsPanel tenant={tenant} editable={true} />);

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
      render(<TenantDetailsPanel tenant={tenant} editable={true} />);

      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(
        await screen.findByText('This slug is already in use.'),
      ).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('shows the form-level provisioning-started error and does not refresh, without a successful save', async () => {
      updateTenantDetailsActionMock.mockResolvedValue({
        ok: false,
        error:
          "This tenant's provisioning has already started; its details can no longer be edited.",
      });
      const user = userEvent.setup();
      const tenant = makeTenant();
      render(<TenantDetailsPanel tenant={tenant} editable={true} />);

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
