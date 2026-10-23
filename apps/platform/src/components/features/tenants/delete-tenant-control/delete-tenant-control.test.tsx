import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouter } from '@platform/testing/mock-router';
import {
  CONFIRM_TENANT_NAME_LABEL,
  mockClientTenant,
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeleteTenantControl } from './delete-tenant-control';

const { deleteTenantActionMock } = vi.hoisted(() => ({
  deleteTenantActionMock: vi.fn(),
}));

vi.mock('@platform/server/provisioning/delete-tenant-action', () => ({
  deleteTenantAction: deleteTenantActionMock,
}));

const DELETE_TENANT_DIALOG_TITLE = `Delete ${MOCK_TENANT_NAME}`;

const TENANT = mockClientTenant({
  deprovisionedAt: MOCK_ARCHIVED_AT,
});

const setup = customRender(DeleteTenantControl, { tenant: TENANT });

describe(`<${DeleteTenantControl.name}/>`, () => {
  let user: UserEvent;
  const pushMock = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    deleteTenantActionMock.mockReset();
    deleteTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    pushMock.mockReset();
    mockRouter({ push: pushMock });
    setup();
  });

  it('titles the card "Delete this tenant permanently", with no deprovision trigger or badge of its own', () => {
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Delete this tenant permanently',
    });
    const deprovisionedBadge = screen.queryByText('Deprovisioned');
    const deprovisionButton = screen.queryByRole('button', {
      name: 'Deprovision',
    });

    expect(heading).toBeVisible();
    expect(deprovisionedBadge).not.toBeInTheDocument();
    expect(deprovisionButton).not.toBeInTheDocument();
  });

  describe('once the dialog is open', () => {
    let dialog: HTMLElement;

    const confirmDeletion = async () => {
      const nameInput = screen.getByRole('textbox', {
        name: CONFIRM_TENANT_NAME_LABEL,
      });
      await user.type(nameInput, MOCK_TENANT_NAME);

      const confirmButton = within(dialog).getByRole('button', {
        name: 'Delete',
      });
      await user.click(confirmButton);
    };

    beforeEach(async () => {
      const openButton = screen.getByRole('button', {
        name: 'Delete tenant permanently',
      });
      await user.click(openButton);
      dialog = await screen.findByRole('alertdialog', {
        name: DELETE_TENANT_DIALOG_TITLE,
      });
    });

    it('requires the tenant name before delete is enabled', async () => {
      const confirmButton = within(dialog).getByRole('button', {
        name: 'Delete',
      });
      expect(confirmButton).toBeDisabled();

      const nameInput = screen.getByRole('textbox', {
        name: CONFIRM_TENANT_NAME_LABEL,
      });
      await user.type(nameInput, MOCK_TENANT_NAME);

      expect(confirmButton).toBeEnabled();
    });

    it('calls the action with the typed name and navigates to the tenant list', async () => {
      await confirmDeletion();

      expect(deleteTenantActionMock).toHaveBeenCalledWith(TENANT.id, {
        confirm: MOCK_TENANT_NAME,
      });
      await vi.waitFor(() =>
        expect(pushMock).toHaveBeenCalledWith(adminRoutes.tenants()),
      );
    });

    it('shows the error inline and never navigates when the action fails', async () => {
      deleteTenantActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
      });
      await confirmDeletion();

      const mismatchError = await screen.findByText(
        "Doesn't match the tenant's name.",
      );

      expect(mismatchError).toBeVisible();
      expect(pushMock).not.toHaveBeenCalled();
    });

    it('shows the delete failure inline when the action reports a server error', async () => {
      deleteTenantActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      await confirmDeletion();

      const deleteFailure = await screen.findByText(
        "Couldn't delete the tenant — try again.",
      );

      expect(deleteFailure).toBeVisible();
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
