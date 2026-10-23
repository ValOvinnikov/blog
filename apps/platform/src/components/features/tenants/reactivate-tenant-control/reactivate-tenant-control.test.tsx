import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  makeClientTenant,
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ReactivateTenantControl } from './reactivate-tenant-control';

const REACTIVATE_TENANT = 'Reactivate tenant';
const REACTIVATE_DIALOG_TITLE = `Reactivate ${MOCK_TENANT_NAME}`;
const CONFIRM_TENANT_NAME_LABEL = `Type "${MOCK_TENANT_NAME}" to confirm`;

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
    await user.click(screen.getByRole('button', { name: REACTIVATE_TENANT }));
    await user.type(
      screen.getByRole('textbox', { name: CONFIRM_TENANT_NAME_LABEL }),
      ARCHIVED_TENANT.name,
    );
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
    expect(
      screen.getByRole('heading', { level: 2, name: 'Reactivate this tenant' }),
    ).toBeVisible();
  });

  it('opens a confirm dialog requiring the tenant name, disabled until it matches', async () => {
    await user.click(screen.getByRole('button', { name: REACTIVATE_TENANT }));

    expect(
      await screen.findByRole('alertdialog', {
        name: REACTIVATE_DIALOG_TITLE,
      }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reactivate' })).toBeDisabled();
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
    await user.click(screen.getByRole('button', { name: 'Reactivate' }));

    expect(
      await screen.findByText('Provisioning is already running.'),
    ).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
