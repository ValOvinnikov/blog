import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';
import { adminRoutes } from '@admin/utils/routes/routes';
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

vi.mock('@admin/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: deprovisionTenantActionMock,
}));

vi.mock('@admin/server/provisioning/delete-tenant-action', () => ({
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
    });
  });

  it('shows an archived badge instead of the trigger for an already-deprovisioned tenant', () => {
    const tenant = makeTenant({
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(<DeprovisionTenantControl tenant={tenant} />);

    expect(screen.getByText('Deprovisioned')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Deprovision tenant' }),
    ).not.toBeInTheDocument();
  });

  it('does not render the delete-permanently trigger for a live tenant', () => {
    const tenant = makeTenant({ deprovisionedAt: null });
    render(<DeprovisionTenantControl tenant={tenant} />);

    expect(
      screen.queryByRole('button', { name: 'Delete tenant permanently' }),
    ).not.toBeInTheDocument();
  });

  it('opens a confirm dialog requiring the tenant slug, disabled until it matches', async () => {
    const user = userEvent.setup();
    const tenant = makeTenant({ slug: 'acme' });
    render(<DeprovisionTenantControl tenant={tenant} />);

    await user.click(
      screen.getByRole('button', { name: 'Deprovision tenant' }),
    );

    expect(
      await screen.findByRole('alertdialog', {
        name: /deprovision acme inc\./i,
      }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Deprovision' })).toBeDisabled();
  });

  it('enables the confirm button only once the typed slug matches, and calls the action on confirm', async () => {
    const user = userEvent.setup();
    const tenant = makeTenant({ slug: 'acme' });
    render(<DeprovisionTenantControl tenant={tenant} />);

    await user.click(
      screen.getByRole('button', { name: 'Deprovision tenant' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: /type "acme"/i }),
      'acme',
    );

    const confirmButton = screen.getByRole('button', { name: 'Deprovision' });
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(deprovisionTenantActionMock).toHaveBeenCalledWith(tenant.id, {
      confirm: 'acme',
      dryRun: true,
    });
  });

  it('shows the error message inline and never refreshes when the action fails', async () => {
    deprovisionTenantActionMock.mockResolvedValue({
      ok: false,
      error: "Doesn't match the tenant's slug.",
    });
    const user = userEvent.setup();
    const tenant = makeTenant({ slug: 'acme' });
    render(<DeprovisionTenantControl tenant={tenant} />);

    await user.click(
      screen.getByRole('button', { name: 'Deprovision tenant' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: /type "acme"/i }),
      'acme',
    );
    await user.click(screen.getByRole('button', { name: 'Deprovision' }));

    expect(
      await screen.findByText("Doesn't match the tenant's slug."),
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
});
