import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { makeClientTenant } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeprovisionTenantControl } from './deprovision-tenant-control';

const { deprovisionTenantActionMock } = vi.hoisted(() => ({
  deprovisionTenantActionMock: vi.fn(),
}));

vi.mock('@platform/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: deprovisionTenantActionMock,
}));

const TENANT = makeClientTenant({ deprovisionedAt: null });

const setup = customRender(DeprovisionTenantControl, { tenant: TENANT });

const openDialog = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: 'Deprovision' }));
  return screen.findByRole('alertdialog', { name: /deprovision acme inc\./i });
};

const getDryRunSwitch = () =>
  screen.getByRole('switch', {
    name: 'Dry run (preview only, nothing is deleted)',
  });

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

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Deprovision this tenant',
      }),
    ).toBeVisible();
  });

  it('does not duplicate a "Danger zone" heading inside the card', () => {
    setup();

    expect(screen.queryByText('Danger zone')).not.toBeInTheDocument();
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
    await user.type(
      screen.getByRole('textbox', { name: /type "acme inc\."/i }),
      'Acme Inc.',
    );

    await user.click(
      within(dialog).getByRole('button', { name: 'Deprovision' }),
    );

    expect(deprovisionTenantActionMock).toHaveBeenCalledWith(TENANT.id, {
      confirm: 'Acme Inc.',
      dryRun: true,
    });
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it('runs for real once the dry-run switch is turned off', async () => {
    setup();
    const dialog = await openDialog(user);
    await user.click(getDryRunSwitch());
    await user.type(
      screen.getByRole('textbox', { name: /type "acme inc\."/i }),
      'Acme Inc.',
    );

    await user.click(
      within(dialog).getByRole('button', { name: 'Deprovision' }),
    );

    expect(deprovisionTenantActionMock).toHaveBeenCalledWith(TENANT.id, {
      confirm: 'Acme Inc.',
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
    await user.type(
      screen.getByRole('textbox', { name: /type "acme inc\."/i }),
      'Acme Inc.',
    );

    await user.click(
      within(dialog).getByRole('button', { name: 'Deprovision' }),
    );

    expect(
      await screen.findByText("Doesn't match the tenant's name."),
    ).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  describe('isDeprovisioningInProgress', () => {
    it('renders the trigger enabled by default, with no in-progress hint', () => {
      setup();

      expect(screen.getByRole('button', { name: 'Deprovision' })).toBeEnabled();
      expect(
        screen.queryByText(
          'A deprovisioning run is already in progress for this tenant.',
        ),
      ).not.toBeInTheDocument();
    });

    it('marks the trigger aria-disabled and describes it with the hint while a run is in progress', () => {
      setup({ isDeprovisioningInProgress: true });

      const trigger = screen.getByRole('button', { name: 'Deprovision' });
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).not.toBeDisabled();
      expect(trigger).toHaveAccessibleDescription(
        'A deprovisioning run is already in progress for this tenant.',
      );
    });
  });
});
