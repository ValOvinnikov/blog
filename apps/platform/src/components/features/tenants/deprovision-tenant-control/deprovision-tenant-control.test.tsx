import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  CONFIRM_TENANT_NAME_LABEL,
  mockClientTenant,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeprovisionTenantControl } from './deprovision-tenant-control';

const { deprovisionTenantActionMock } = vi.hoisted(() => ({
  deprovisionTenantActionMock: vi.fn(),
}));

vi.mock('@platform/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: deprovisionTenantActionMock,
}));

const MOCK_CLIENT_TENANT = mockClientTenant({ deprovisionedAt: null });

const setup = customRender(DeprovisionTenantControl, {
  tenant: MOCK_CLIENT_TENANT,
});

const DEPROVISION = 'Deprovision';
const DEPROVISION_DIALOG_TITLE = `Deprovision ${MOCK_TENANT_NAME}`;
const DRY_RUN_LABEL = 'Dry run (preview only, nothing is deleted)';
const RUN_IN_PROGRESS_HINT =
  'A deprovisioning run is already in progress for this tenant.';

const openDialog = async (user: UserEvent) => {
  const triggerButton = screen.getByRole('button', { name: DEPROVISION });
  await user.click(triggerButton);

  return screen.findByRole('alertdialog', { name: DEPROVISION_DIALOG_TITLE });
};

const typeTenantNameAndConfirm = async (
  user: UserEvent,
  dialog: HTMLElement,
) => {
  const nameInput = screen.getByRole('textbox', {
    name: CONFIRM_TENANT_NAME_LABEL,
  });
  await user.type(nameInput, MOCK_TENANT_NAME);

  const confirmButton = within(dialog).getByRole('button', {
    name: DEPROVISION,
  });
  await user.click(confirmButton);
};

describe(`<${DeprovisionTenantControl.name}/>`, () => {
  let user: UserEvent;
  const refreshMock = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    deprovisionTenantActionMock.mockReset();
    deprovisionTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    refreshMock.mockReset();
    mockRouterRefresh(refreshMock);
  });

  it('titles the card "Deprovision this tenant"', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Deprovision this tenant',
    });

    expect(heading).toBeVisible();
  });

  it('does not duplicate a "Danger zone" heading inside the card', () => {
    setup();

    const dangerZoneText = screen.queryByText('Danger zone');

    expect(dangerZoneText).not.toBeInTheDocument();
  });

  it('opens a confirm dialog requiring the tenant name, disabled until it matches', async () => {
    setup();

    const dialog = await openDialog(user);
    const confirmButton = within(dialog).getByRole('button', {
      name: DEPROVISION,
    });

    expect(dialog).toBeVisible();
    expect(confirmButton).toBeDisabled();
  });

  it('calls the action as a dry run with the typed name, then refreshes', async () => {
    setup();
    const dialog = await openDialog(user);

    await typeTenantNameAndConfirm(user, dialog);

    expect(deprovisionTenantActionMock).toHaveBeenCalledWith(
      MOCK_CLIENT_TENANT.id,
      {
        confirm: MOCK_TENANT_NAME,
        dryRun: true,
      },
    );
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it('runs for real once the dry-run switch is turned off', async () => {
    setup();
    const dialog = await openDialog(user);
    const dryRunSwitch = screen.getByRole('switch', { name: DRY_RUN_LABEL });
    await user.click(dryRunSwitch);

    await typeTenantNameAndConfirm(user, dialog);

    expect(deprovisionTenantActionMock).toHaveBeenCalledWith(
      MOCK_CLIENT_TENANT.id,
      {
        confirm: MOCK_TENANT_NAME,
        dryRun: false,
      },
    );
  });

  it('turns the dry-run switch back on when the dialog closes', async () => {
    setup();
    await openDialog(user);
    const dryRunSwitch = screen.getByRole('switch', { name: DRY_RUN_LABEL });
    await user.click(dryRunSwitch);

    expect(dryRunSwitch).not.toBeChecked();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    await openDialog(user);

    const reopenedDryRunSwitch = screen.getByRole('switch', {
      name: DRY_RUN_LABEL,
    });

    expect(reopenedDryRunSwitch).toBeChecked();
  });

  it('shows the error message inline and never refreshes when the action fails', async () => {
    deprovisionTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
    });
    setup();
    const dialog = await openDialog(user);

    await typeTenantNameAndConfirm(user, dialog);

    const mismatchError = await screen.findByText(
      "Doesn't match the tenant's name.",
    );

    expect(mismatchError).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  describe('with a run in progress', () => {
    it('offers an enabled trigger with no hint when no run is in progress', () => {
      setup();

      const trigger = screen.getByRole('button', { name: DEPROVISION });
      const hint = screen.queryByText(RUN_IN_PROGRESS_HINT);

      expect(trigger).toBeEnabled();
      expect(hint).not.toBeInTheDocument();
    });

    it('blocks the trigger and explains why while a run is in progress', () => {
      setup({ isDeprovisioningInProgress: true });

      const trigger = screen.getByRole('button', { name: DEPROVISION });

      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).not.toBeDisabled();
      expect(trigger).toHaveAccessibleDescription(RUN_IN_PROGRESS_HINT);
    });
  });
});
