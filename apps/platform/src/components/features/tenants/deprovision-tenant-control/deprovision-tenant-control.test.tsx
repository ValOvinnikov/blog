import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_TENANT_NAME,
  mockClientTenant,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeprovisionTenantControl } from './deprovision-tenant-control';

const { deprovisionTenantActionMock } = vi.hoisted(() => ({
  deprovisionTenantActionMock: vi.fn(),
}));

vi.mock('@platform/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: deprovisionTenantActionMock,
}));

let user: UserEvent;

const TENANT = mockClientTenant({ deprovisionedAt: null });
const IN_PROGRESS_HINT =
  'A deprovisioning run is already in progress for this tenant.';

const setup = customRender(DeprovisionTenantControl, { tenant: TENANT });

const openDialog = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: 'Deprovision' }));
  return screen.findByRole('alertdialog', { name: /deprovision acme inc\./i });
};

const confirmDeprovision = async (dialog: HTMLElement) => {
  await user.type(
    screen.getByRole('textbox', { name: /type "acme inc\."/i }),
    MOCK_TENANT_NAME,
  );
  await user.click(within(dialog).getByRole('button', { name: 'Deprovision' }));
};

const getDryRunSwitch = () =>
  screen.getByRole('switch', {
    name: 'Dry run (preview only, nothing is deleted)',
  });

describe(`<${DeprovisionTenantControl.name}/>`, () => {
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

  it('titles the card "Deprovision this tenant" with no "Danger zone" repeat', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Deprovision this tenant',
    });
    const dangerZone = screen.queryByText('Danger zone');
    expect(heading).toBeVisible();
    expect(dangerZone).not.toBeInTheDocument();
  });

  it('opens a confirm dialog requiring the tenant name, disabled until it matches', async () => {
    setup();

    const dialog = await openDialog(user);

    expect(dialog).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'Deprovision' }),
    ).toBeDisabled();
  });

  it('calls the action as a dry run with the typed name, then refreshes', async () => {
    setup();
    const dialog = await openDialog(user);
    await confirmDeprovision(dialog);

    expect(deprovisionTenantActionMock).toHaveBeenCalledWith(TENANT.id, {
      confirm: MOCK_TENANT_NAME,
      dryRun: true,
    });
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it('runs for real once the dry-run switch is turned off', async () => {
    setup();
    const dialog = await openDialog(user);
    await user.click(getDryRunSwitch());
    await confirmDeprovision(dialog);

    expect(deprovisionTenantActionMock).toHaveBeenCalledWith(TENANT.id, {
      confirm: MOCK_TENANT_NAME,
      dryRun: false,
    });
  });

  it('turns the dry-run switch back on when the dialog closes', async () => {
    setup();
    await openDialog(user);
    await user.click(getDryRunSwitch());
    expect(getDryRunSwitch()).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await openDialog(user);

    expect(getDryRunSwitch()).toBeChecked();
  });

  it('shows the error message inline and never refreshes when the action fails', async () => {
    deprovisionTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
    });
    setup();
    const dialog = await openDialog(user);
    await confirmDeprovision(dialog);

    expect(
      await screen.findByText("Doesn't match the tenant's name."),
    ).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  describe('isDeprovisioningInProgress', () => {
    it('renders the trigger enabled by default, with no in-progress hint', () => {
      setup();

      expect(screen.getByRole('button', { name: 'Deprovision' })).toBeEnabled();
      expect(screen.queryByText(IN_PROGRESS_HINT)).not.toBeInTheDocument();
    });

    it('marks the trigger aria-disabled and describes it with the hint while a run is in progress', () => {
      setup({ isDeprovisioningInProgress: true });

      const trigger = screen.getByRole('button', { name: 'Deprovision' });
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).not.toBeDisabled();
      expect(trigger).toHaveAccessibleDescription(IN_PROGRESS_HINT);
    });
  });
});
