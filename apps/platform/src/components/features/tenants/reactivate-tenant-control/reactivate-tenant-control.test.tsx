import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  CONFIRM_TENANT_NAME_LABEL,
  mockClientTenant,
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_NAME,
  REACTIVATE_TENANT_LABEL,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ReactivateTenantControl } from './reactivate-tenant-control';

const REACTIVATE_DIALOG_TITLE = `Reactivate ${MOCK_TENANT_NAME}`;
const REACTIVATE_CONFIRM_LABEL = 'Reactivate';

const { reactivateTenantActionMock } = vi.hoisted(() => ({
  reactivateTenantActionMock: vi.fn(),
}));

vi.mock('@platform/server/provisioning/reactivate-tenant-action', () => ({
  reactivateTenantAction: reactivateTenantActionMock,
}));

const MOCK_ARCHIVED_TENANT = mockClientTenant({
  deprovisionedAt: MOCK_ARCHIVED_AT,
});

const setup = customRender(ReactivateTenantControl, {
  tenant: MOCK_ARCHIVED_TENANT,
});

describe(`<${ReactivateTenantControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  const typeTenantNameToConfirm = async () => {
    const openButton = screen.getByRole('button', {
      name: REACTIVATE_TENANT_LABEL,
    });
    await user.click(openButton);

    const nameInput = screen.getByRole('textbox', {
      name: CONFIRM_TENANT_NAME_LABEL,
    });
    await user.type(nameInput, MOCK_ARCHIVED_TENANT.name);
  };

  beforeEach(() => {
    user = userEvent.setup();
    reactivateTenantActionMock.mockReset();
    reactivateTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    refresh = mockRouterRefresh();
    setup();
  });

  it('titles the card "Reactivate this tenant"', () => {
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Reactivate this tenant',
    });

    expect(heading).toBeVisible();
  });

  it('asks for the tenant name in a dialog, disabled until it matches', async () => {
    const openButton = screen.getByRole('button', {
      name: REACTIVATE_TENANT_LABEL,
    });
    await user.click(openButton);

    const dialog = await screen.findByRole('alertdialog', {
      name: REACTIVATE_DIALOG_TITLE,
    });
    const confirmButton = screen.getByRole('button', {
      name: REACTIVATE_CONFIRM_LABEL,
    });

    expect(dialog).toBeVisible();
    expect(confirmButton).toBeDisabled();
  });

  it('reactivates with the typed name and refreshes on success', async () => {
    await typeTenantNameToConfirm();

    const confirmButton = screen.getByRole('button', {
      name: REACTIVATE_CONFIRM_LABEL,
    });
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(reactivateTenantActionMock).toHaveBeenCalledWith(
      MOCK_ARCHIVED_TENANT.id,
      { confirm: MOCK_ARCHIVED_TENANT.name },
    );
    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the refusal inline and does not refresh when the action fails', async () => {
    reactivateTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    });
    await typeTenantNameToConfirm();
    const confirmButton = screen.getByRole('button', {
      name: REACTIVATE_CONFIRM_LABEL,
    });
    await user.click(confirmButton);

    const refusal = await screen.findByText('Provisioning is already running.');

    expect(refusal).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });
});
