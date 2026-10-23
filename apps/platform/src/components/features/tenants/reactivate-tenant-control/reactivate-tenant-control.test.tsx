import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  CONFIRM_TENANT_NAME_LABEL,
  makeClientTenant,
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_NAME,
  REACTIVATE_TENANT_LABEL,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ReactivateTenantControl } from './reactivate-tenant-control';

const REACTIVATE_DIALOG_TITLE = `Reactivate ${MOCK_TENANT_NAME}`;

const { reactivateTenantActionMock } = vi.hoisted(() => ({
  reactivateTenantActionMock: vi.fn(),
}));

vi.mock('@platform/server/provisioning/reactivate-tenant-action', () => ({
  reactivateTenantAction: reactivateTenantActionMock,
}));

const ARCHIVED_TENANT = makeClientTenant({
  deprovisionedAt: MOCK_ARCHIVED_AT,
});

const setup = customRender(ReactivateTenantControl, {
  tenant: ARCHIVED_TENANT,
});

describe(`<${ReactivateTenantControl.name}/>`, () => {
  const refreshMock = vi.fn();
  let user: UserEvent;

  const typeTenantNameToConfirm = async () => {
    const openButton = screen.getByRole('button', {
      name: REACTIVATE_TENANT_LABEL,
    });
    await user.click(openButton);

    const nameInput = screen.getByRole('textbox', {
      name: CONFIRM_TENANT_NAME_LABEL,
    });
    await user.type(nameInput, ARCHIVED_TENANT.name);
  };

  beforeEach(() => {
    user = userEvent.setup();
    reactivateTenantActionMock.mockReset();
    reactivateTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    refreshMock.mockReset();
    mockRouterRefresh(refreshMock);
    setup();
  });

  it('titles the card "Reactivate this tenant"', () => {
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Reactivate this tenant',
    });

    expect(heading).toBeVisible();
  });

  it('opens a confirm dialog requiring the tenant name, disabled until it matches', async () => {
    const openButton = screen.getByRole('button', {
      name: REACTIVATE_TENANT_LABEL,
    });
    await user.click(openButton);

    const dialog = await screen.findByRole('alertdialog', {
      name: REACTIVATE_DIALOG_TITLE,
    });
    const confirmButton = screen.getByRole('button', { name: 'Reactivate' });

    expect(dialog).toBeVisible();
    expect(confirmButton).toBeDisabled();
  });

  it('calls the action with the typed name and refreshes on success', async () => {
    await typeTenantNameToConfirm();

    const confirmButton = screen.getByRole('button', { name: 'Reactivate' });
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(reactivateTenantActionMock).toHaveBeenCalledWith(
      ARCHIVED_TENANT.id,
      { confirm: ARCHIVED_TENANT.name },
    );
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it('shows the error message inline and never refreshes when the action fails', async () => {
    reactivateTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    });
    await typeTenantNameToConfirm();
    const confirmButton = screen.getByRole('button', { name: 'Reactivate' });
    await user.click(confirmButton);

    const refusal = await screen.findByText('Provisioning is already running.');

    expect(refusal).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
