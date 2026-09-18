import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { ReactivateTenantControl } from './reactivate-tenant-control';

const { reactivateTenantActionMock } = vi.hoisted(() => ({
  reactivateTenantActionMock: vi.fn(),
}));

vi.mock('@platform/server/provisioning/reactivate-tenant-action', () => ({
  reactivateTenantAction: reactivateTenantActionMock,
}));

const ARCHIVED_TENANT = makeTenant({
  deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
});

const setup = customRender(ReactivateTenantControl, {
  tenant: ARCHIVED_TENANT,
});

describe(`<${ReactivateTenantControl.name}/>`, () => {
  const refreshMock = vi.fn();

  beforeEach(() => {
    reactivateTenantActionMock.mockReset();
    reactivateTenantActionMock.mockResolvedValue({ ok: true });
    refreshMock.mockReset();
    mockRouterRefresh(refreshMock);
  });

  it('titles the card "Reactivate this tenant"', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Reactivate this tenant' }),
    ).toBeVisible();
  });

  it('opens a confirm dialog requiring the tenant name, disabled until it matches', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Reactivate tenant' }));

    expect(
      await screen.findByRole('alertdialog', {
        name: /reactivate acme inc\./i,
      }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reactivate' })).toBeDisabled();
  });

  it('calls the action with the typed name and refreshes on success', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Reactivate tenant' }));
    await user.type(
      screen.getByRole('textbox', { name: /type "acme inc\."/i }),
      'Acme Inc.',
    );

    const confirmButton = screen.getByRole('button', { name: 'Reactivate' });
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(reactivateTenantActionMock).toHaveBeenCalledWith(
      ARCHIVED_TENANT.id,
      { confirm: 'Acme Inc.' },
    );
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it('shows the error message inline and never refreshes when the action fails', async () => {
    reactivateTenantActionMock.mockResolvedValue({
      ok: false,
      error: 'Provisioning is already running.',
    });
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Reactivate tenant' }));
    await user.type(
      screen.getByRole('textbox', { name: /type "acme inc\."/i }),
      'Acme Inc.',
    );
    await user.click(screen.getByRole('button', { name: 'Reactivate' }));

    expect(
      await screen.findByText('Provisioning is already running.'),
    ).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
