import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { BLOCK_REASON } from '@platform/testing/blocked-signups/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { makeClientTenant } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantSuspensionControl } from './tenant-suspension-control';

const { suspendTenantActionMock, liftTenantSuspensionActionMock } = vi.hoisted(
  () => ({
    suspendTenantActionMock: vi.fn(),
    liftTenantSuspensionActionMock: vi.fn(),
  }),
);

vi.mock('@platform/server/tenants/tenant-suspension-actions', () => ({
  suspendTenantAction: suspendTenantActionMock,
  liftTenantSuspensionAction: liftTenantSuspensionActionMock,
}));

const ACTIVE_TENANT = makeClientTenant({ status: TENANT_STATUS.ACTIVE });
const SUSPENDED_TENANT = makeClientTenant({ status: TENANT_STATUS.SUSPENDED });

const setup = customRender(TenantSuspensionControl, { tenant: ACTIVE_TENANT });

const OPEN_SUSPEND = 'Suspend tenant';
const CONFIRM_SUSPEND = 'Suspend';
const OPEN_REACTIVATE = 'Reactivate tenant';
const CONFIRM_REACTIVATE = 'Reactivate';
const BLOCK_SWITCH = "Also block this owner's email";
const BLOCK_REASON_FIELD = 'Reason for blocking';

describe(`<${TenantSuspensionControl.name}/>`, () => {
  const refreshMock = vi.fn();
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    suspendTenantActionMock.mockReset();
    suspendTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    liftTenantSuspensionActionMock.mockReset();
    liftTenantSuspensionActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    refreshMock.mockReset();
    mockRouterRefresh(refreshMock);
  });

  const blockOwnerAndConfirm = async () => {
    await user.click(screen.getByRole('button', { name: OPEN_SUSPEND }));
    await user.click(await screen.findByRole('switch', { name: BLOCK_SWITCH }));
    await user.type(
      screen.getByRole('textbox', { name: BLOCK_REASON_FIELD }),
      BLOCK_REASON,
    );
    await user.click(screen.getByRole('button', { name: CONFIRM_SUSPEND }));
  };

  it('suspends an active tenant only after the operator confirms', async () => {
    setup();

    await user.click(screen.getByRole('button', { name: OPEN_SUSPEND }));

    const dialog = await screen.findByRole('alertdialog', {
      name: /suspend acme inc\./i,
    });
    const consequence = screen.getByText(/its contact form disappears/i);

    expect(dialog).toBeVisible();
    expect(consequence).toBeVisible();
    expect(suspendTenantActionMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: CONFIRM_SUSPEND }));

    expect(suspendTenantActionMock).toHaveBeenCalledWith(ACTIVE_TENANT.id);
    expect(liftTenantSuspensionActionMock).not.toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalled();
  });

  it('reactivates a suspended tenant', async () => {
    setup({ tenant: SUSPENDED_TENANT });

    const cardTitle = screen.getByRole('heading', {
      level: 2,
      name: 'This tenant is suspended',
    });
    expect(cardTitle).toBeVisible();

    await user.click(screen.getByRole('button', { name: OPEN_REACTIVATE }));
    await user.click(
      await screen.findByRole('button', { name: CONFIRM_REACTIVATE }),
    );

    expect(liftTenantSuspensionActionMock).toHaveBeenCalledWith(
      SUSPENDED_TENANT.id,
    );
    expect(suspendTenantActionMock).not.toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalled();
  });

  it('keeps the dialog open with the refusal for a tenant archived meanwhile', async () => {
    suspendTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });
    setup();

    await user.click(screen.getByRole('button', { name: OPEN_SUSPEND }));
    await user.click(
      await screen.findByRole('button', { name: CONFIRM_SUSPEND }),
    );

    const refusal = await screen.findByText('This tenant is archived.');
    expect(refusal).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('also blocks the owner email with the entered reason when the operator chooses to', async () => {
    setup();

    await blockOwnerAndConfirm();

    expect(suspendTenantActionMock).toHaveBeenCalledWith(ACTIVE_TENANT.id, {
      reason: BLOCK_REASON,
    });
  });

  it('cannot confirm a block until a reason is entered', async () => {
    setup();

    await user.click(screen.getByRole('button', { name: OPEN_SUSPEND }));
    await user.click(await screen.findByRole('switch', { name: BLOCK_SWITCH }));

    const confirm = screen.getByRole('button', { name: CONFIRM_SUSPEND });

    expect(confirm).toBeDisabled();
  });

  it('suspends without a block when the choice is left off', async () => {
    setup();

    await user.click(screen.getByRole('button', { name: OPEN_SUSPEND }));
    await user.click(
      await screen.findByRole('button', { name: CONFIRM_SUSPEND }),
    );

    expect(suspendTenantActionMock).toHaveBeenCalledWith(ACTIVE_TENANT.id);
  });

  it('keeps the dialog open with the refusal when the owner has no email on record', async () => {
    suspendTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN,
    });
    setup();

    await blockOwnerAndConfirm();

    const refusal = await screen.findByText(
      /owner has no email address on record/i,
    );

    expect(refusal).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('offers no block choice when reactivating', async () => {
    setup({ tenant: SUSPENDED_TENANT });

    await user.click(screen.getByRole('button', { name: OPEN_REACTIVATE }));
    await screen.findByRole('button', { name: CONFIRM_REACTIVATE });

    const blockSwitch = screen.queryByRole('switch', { name: BLOCK_SWITCH });

    expect(blockSwitch).not.toBeInTheDocument();
  });
});
