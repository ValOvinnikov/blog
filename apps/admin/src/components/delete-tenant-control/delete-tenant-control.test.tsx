import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';
import { adminRoutes } from '@admin/utils/routes/routes';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { DeleteTenantControl } from './delete-tenant-control';

const render = renderWithIntl;

const { deleteTenantActionMock } = vi.hoisted(() => ({
  deleteTenantActionMock: vi.fn(),
}));

vi.mock('@admin/server/provisioning/delete-tenant-action', () => ({
  deleteTenantAction: deleteTenantActionMock,
}));

describe(DeleteTenantControl, () => {
  const pushMock = vi.fn();

  beforeEach(() => {
    deleteTenantActionMock.mockReset();
    deleteTenantActionMock.mockResolvedValue({ ok: true });
    pushMock.mockReset();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    });
  });

  it('renders nothing for a tenant that is not archived', () => {
    const tenant = makeTenant({ deprovisionedAt: null });
    render(<DeleteTenantControl tenant={tenant} />);

    expect(
      screen.queryByRole('button', { name: 'Delete tenant permanently' }),
    ).not.toBeInTheDocument();
  });

  it('opens a confirm dialog requiring the tenant name, disabled until it matches', async () => {
    const user = userEvent.setup();
    const tenant = makeTenant({
      name: 'Acme Inc.',
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(<DeleteTenantControl tenant={tenant} />);

    await user.click(
      screen.getByRole('button', { name: 'Delete tenant permanently' }),
    );

    expect(
      await screen.findByRole('alertdialog', { name: /delete acme inc\./i }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('enables the confirm button only once the typed name matches, and calls the action on confirm', async () => {
    const user = userEvent.setup();
    const tenant = makeTenant({
      name: 'Acme Inc.',
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(<DeleteTenantControl tenant={tenant} />);

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
  });

  it('redirects to the tenant list once the delete succeeds', async () => {
    const user = userEvent.setup();
    const tenant = makeTenant({
      name: 'Acme Inc.',
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(<DeleteTenantControl tenant={tenant} />);

    await user.click(
      screen.getByRole('button', { name: 'Delete tenant permanently' }),
    );
    await user.type(
      screen.getByRole('textbox', { name: /type "acme inc\."/i }),
      'Acme Inc.',
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(pushMock).toHaveBeenCalledWith(adminRoutes.tenants());
  });

  it('shows the error message inline and never redirects when the action fails', async () => {
    deleteTenantActionMock.mockResolvedValue({
      ok: false,
      error: "Doesn't match the tenant's name.",
    });
    const user = userEvent.setup();
    const tenant = makeTenant({
      name: 'Acme Inc.',
      deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    render(<DeleteTenantControl tenant={tenant} />);

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
