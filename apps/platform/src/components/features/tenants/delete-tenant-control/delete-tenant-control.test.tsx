import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouter } from '@platform/testing/mock-router';
import { makeClientTenant } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeleteTenantControl } from './delete-tenant-control';

const { deleteTenantActionMock } = vi.hoisted(() => ({
  deleteTenantActionMock: vi.fn(),
}));

vi.mock('@platform/server/provisioning/delete-tenant-action', () => ({
  deleteTenantAction: deleteTenantActionMock,
}));

const TENANT = makeClientTenant({
  deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
});

const setup = customRender(DeleteTenantControl, { tenant: TENANT });

describe(`<${DeleteTenantControl.name}/>`, () => {
  let user: UserEvent;
  const pushMock = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    deleteTenantActionMock.mockReset();
    deleteTenantActionMock.mockResolvedValue({ ok: true });
    pushMock.mockReset();
    mockRouter({ push: pushMock });
    setup();
  });

  it('titles the card "Delete this tenant permanently", with no deprovision trigger or badge of its own', () => {
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Delete this tenant permanently',
      }),
    ).toBeVisible();
    expect(screen.queryByText('Deprovisioned')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Deprovision' }),
    ).not.toBeInTheDocument();
  });

  describe('once the dialog is open', () => {
    let dialog: HTMLElement;

    beforeEach(async () => {
      await user.click(
        screen.getByRole('button', { name: 'Delete tenant permanently' }),
      );
      dialog = await screen.findByRole('alertdialog', {
        name: /delete acme inc\./i,
      });
    });

    it('requires the tenant name before delete is enabled', async () => {
      const confirmButton = within(dialog).getByRole('button', {
        name: 'Delete',
      });
      expect(confirmButton).toBeDisabled();

      await user.type(
        screen.getByRole('textbox', { name: /type "acme inc\."/i }),
        'Acme Inc.',
      );

      expect(confirmButton).toBeEnabled();
    });

    it('calls the action with the typed name and navigates to the tenant list', async () => {
      await user.type(
        screen.getByRole('textbox', { name: /type "acme inc\."/i }),
        'Acme Inc.',
      );

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

      expect(deleteTenantActionMock).toHaveBeenCalledWith(TENANT.id, {
        confirm: 'Acme Inc.',
      });
      await vi.waitFor(() =>
        expect(pushMock).toHaveBeenCalledWith(adminRoutes.tenants()),
      );
    });

    it('shows the error inline and never navigates when the action fails', async () => {
      deleteTenantActionMock.mockResolvedValue({
        ok: false,
        error: "Doesn't match the tenant's name.",
      });
      await user.type(
        screen.getByRole('textbox', { name: /type "acme inc\."/i }),
        'Acme Inc.',
      );

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

      expect(
        await screen.findByText("Doesn't match the tenant's name."),
      ).toBeVisible();
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
