import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { DeprovisionTenantControl } from './deprovision-tenant-control';

const render = renderWithIntl;

const { deprovisionTenantActionMock, deleteTenantActionMock } = vi.hoisted(
  () => ({
    deprovisionTenantActionMock: vi.fn(),
    deleteTenantActionMock: vi.fn(),
  }),
);

vi.mock('@platform/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: deprovisionTenantActionMock,
}));

vi.mock('@platform/server/provisioning/delete-tenant-action', () => ({
  deleteTenantAction: deleteTenantActionMock,
}));

describe(DeprovisionTenantControl, () => {
  const refreshMock = vi.fn();
  const pushMock = vi.fn();

  beforeEach(() => {
    deprovisionTenantActionMock.mockReset();
    deprovisionTenantActionMock.mockResolvedValue({ ok: true });
    deleteTenantActionMock.mockReset();
    deleteTenantActionMock.mockResolvedValue({ ok: true });
    refreshMock.mockReset();
    pushMock.mockReset();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: refreshMock,
      bfcacheId: '',
    });
  });

  it('titles the card "Deprovision this tenant" for a live tenant', () => {
    const tenant = makeTenant({ deprovisionedAt: null });
    render(<DeprovisionTenantControl tenant={tenant} />);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Deprovision this tenant',
      }),
    ).toBeVisible();
  });

  it('titles the card "Delete this tenant permanently" for an already-deprovisioned tenant', () => {
    const tenant = makeTenant({
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(<DeprovisionTenantControl tenant={tenant} />);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Delete this tenant permanently',
      }),
    ).toBeVisible();
  });

  it('does not duplicate a "Danger zone" heading inside the card', () => {
    const tenant = makeTenant({ deprovisionedAt: null });
    render(<DeprovisionTenantControl tenant={tenant} />);

    expect(screen.queryByText('Danger zone')).not.toBeInTheDocument();
  });

  it('never renders the live-tenant trigger, or a Deprovisioned badge of its own, for an already-deprovisioned tenant', () => {
    const tenant = makeTenant({
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(<DeprovisionTenantControl tenant={tenant} />);

    expect(screen.queryByText('Deprovisioned')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Deprovision' }),
    ).not.toBeInTheDocument();
  });

  it('does not render the delete-permanently trigger for a live tenant', () => {
    const tenant = makeTenant({ deprovisionedAt: null });
    render(<DeprovisionTenantControl tenant={tenant} />);

    expect(
      screen.queryByRole('button', { name: 'Delete tenant permanently' }),
    ).not.toBeInTheDocument();
  });

  it('opens a confirm dialog requiring the tenant name, disabled until it matches', async () => {
    const user = userEvent.setup();
    const tenant = makeTenant();
    render(<DeprovisionTenantControl tenant={tenant} />);

    await user.click(screen.getByRole('button', { name: 'Deprovision' }));

    const dialog = await screen.findByRole('alertdialog', {
      name: /deprovision acme inc\./i,
    });
    expect(dialog).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'Deprovision' }),
    ).toBeDisabled();
  });

  it('enables the confirm button only once the typed name matches, and calls the action on confirm', async () => {
    const user = userEvent.setup();
    const tenant = makeTenant();
    render(<DeprovisionTenantControl tenant={tenant} />);

    await user.click(screen.getByRole('button', { name: 'Deprovision' }));
    await user.type(
      screen.getByRole('textbox', { name: /type "acme inc\."/i }),
      'Acme Inc.',
    );

    const dialog = screen.getByRole('alertdialog');
    const confirmButton = within(dialog).getByRole('button', {
      name: 'Deprovision',
    });
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(deprovisionTenantActionMock).toHaveBeenCalledWith(tenant.id, {
      confirm: 'Acme Inc.',
      dryRun: true,
    });
  });

  it('shows the error message inline and never refreshes when the action fails', async () => {
    deprovisionTenantActionMock.mockResolvedValue({
      ok: false,
      error: "Doesn't match the tenant's name.",
    });
    const user = userEvent.setup();
    const tenant = makeTenant();
    render(<DeprovisionTenantControl tenant={tenant} />);

    await user.click(screen.getByRole('button', { name: 'Deprovision' }));
    await user.type(
      screen.getByRole('textbox', { name: /type "acme inc\."/i }),
      'Acme Inc.',
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Deprovision',
      }),
    );

    expect(
      await screen.findByText("Doesn't match the tenant's name."),
    ).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('opens a delete-permanently confirm dialog requiring the tenant name, disabled until it matches', async () => {
    const user = userEvent.setup();
    const tenant = makeTenant({
      name: 'Acme Inc.',
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(<DeprovisionTenantControl tenant={tenant} />);

    await user.click(
      screen.getByRole('button', { name: 'Delete tenant permanently' }),
    );

    expect(
      await screen.findByRole('alertdialog', { name: /delete acme inc\./i }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('enables the delete confirm button only once the typed name matches, calls the action, and redirects to the tenant list', async () => {
    const user = userEvent.setup();
    const tenant = makeTenant({
      name: 'Acme Inc.',
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(<DeprovisionTenantControl tenant={tenant} />);

    await user.click(
      screen.getByRole('button', { name: 'Delete tenant permanently' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: /type "acme inc\."/i }),
      'Acme Inc.',
    );

    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(deleteTenantActionMock).toHaveBeenCalledWith(tenant.id, {
      confirm: 'Acme Inc.',
    });
    expect(pushMock).toHaveBeenCalledWith(adminRoutes.tenants());
  });

  it('shows the delete error message inline and never redirects when the action fails', async () => {
    deleteTenantActionMock.mockResolvedValue({
      ok: false,
      error: "Doesn't match the tenant's name.",
    });
    const user = userEvent.setup();
    const tenant = makeTenant({
      name: 'Acme Inc.',
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(<DeprovisionTenantControl tenant={tenant} />);

    await user.click(
      screen.getByRole('button', { name: 'Delete tenant permanently' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: /type "acme inc\."/i }),
      'Acme Inc.',
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      await screen.findByText("Doesn't match the tenant's name."),
    ).toBeVisible();
    expect(pushMock).not.toHaveBeenCalled();
  });

  describe('isDeprovisioningInProgress', () => {
    it('renders the trigger enabled by default, with no in-progress hint', () => {
      const tenant = makeTenant({ deprovisionedAt: null });
      render(<DeprovisionTenantControl tenant={tenant} />);

      expect(screen.getByRole('button', { name: 'Deprovision' })).toBeEnabled();
      expect(
        screen.queryByText(
          'A deprovisioning run is already in progress for this tenant.',
        ),
      ).not.toBeInTheDocument();
    });

    it('disables the trigger and shows the hint while a run is in progress', () => {
      const tenant = makeTenant({ deprovisionedAt: null });
      render(
        <DeprovisionTenantControl
          tenant={tenant}
          isDeprovisioningInProgress={true}
        />,
      );

      const trigger = screen.getByRole('button', { name: 'Deprovision' });
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).not.toBeDisabled();
      expect(
        screen.getByText(
          'A deprovisioning run is already in progress for this tenant.',
        ),
      ).toBeVisible();
      expect(trigger).toHaveAccessibleDescription(
        'A deprovisioning run is already in progress for this tenant.',
      );
    });
  });
});
