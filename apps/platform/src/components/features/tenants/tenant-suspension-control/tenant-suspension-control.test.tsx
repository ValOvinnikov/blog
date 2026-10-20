import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
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

  it('suspends an active tenant only after the operator confirms', async () => {
    setup();

    await user.click(screen.getByRole('button', { name: 'Suspend tenant' }));

    expect(
      await screen.findByRole('alertdialog', { name: /suspend acme inc\./i }),
    ).toBeVisible();
    expect(screen.getByText(/its contact form disappears/i)).toBeVisible();
    expect(suspendTenantActionMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Suspend' }));

    expect(suspendTenantActionMock).toHaveBeenCalledWith(ACTIVE_TENANT.id);
    expect(liftTenantSuspensionActionMock).not.toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalled();
  });

  it('reactivates a suspended tenant', async () => {
    setup({ tenant: SUSPENDED_TENANT });

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'This tenant is suspended',
      }),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Reactivate tenant' }));
    await user.click(await screen.findByRole('button', { name: 'Reactivate' }));

    expect(liftTenantSuspensionActionMock).toHaveBeenCalledWith(
      SUSPENDED_TENANT.id,
    );
    expect(suspendTenantActionMock).not.toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalled();
  });

  it('keeps the dialog open with the refusal when the tenant was archived meanwhile', async () => {
    suspendTenantActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });
    setup();

    await user.click(screen.getByRole('button', { name: 'Suspend tenant' }));
    await user.click(await screen.findByRole('button', { name: 'Suspend' }));

    expect(await screen.findByText('This tenant is archived.')).toBeVisible();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
