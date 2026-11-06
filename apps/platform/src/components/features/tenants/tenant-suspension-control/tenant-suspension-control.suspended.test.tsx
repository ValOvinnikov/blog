import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import en from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_SUSPENDED_BY_EMAIL,
  MOCK_SUSPENSION_CASE,
  MOCK_SUSPENSION_DESCRIPTION,
  MOCK_SUSPENSION_REFERENCE,
  mockTenantSuspension,
} from '@platform/testing/tenant-suspensions/fixtures';
import { mockClientTenant } from '@platform/testing/tenants/fixtures';
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

const { tenantSuspensionControl, suspensionCategory } = en;
const { SUSPENDED, blockOwner } = tenantSuspensionControl;
const CATEGORY_LABEL = suspensionCategory[MOCK_SUSPENSION_CASE.category];

const SUSPENDED_TENANT = mockClientTenant({ status: TENANT_STATUS.SUSPENDED });

const setup = customRender(TenantSuspensionControl, {
  tenant: SUSPENDED_TENANT,
  suspension: undefined,
});

describe(`<${TenantSuspensionControl.name}/> on a suspended tenant`, () => {
  let refreshMock: ReturnType<typeof mockRouterRefresh>;
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    suspendTenantActionMock.mockReset();
    liftTenantSuspensionActionMock.mockReset();
    liftTenantSuspensionActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    refreshMock = mockRouterRefresh();
  });

  it('shows the open case of a suspended tenant', () => {
    setup({ suspension: mockTenantSuspension() });

    const reference = screen.getByText(MOCK_SUSPENSION_REFERENCE);
    const category = screen.getByText(CATEGORY_LABEL);
    const statement = screen.getByText(MOCK_SUSPENSION_DESCRIPTION);
    const suspendedBy = screen.getByText(MOCK_SUSPENDED_BY_EMAIL);

    expect(reference).toBeVisible();
    expect(category).toBeVisible();
    expect(statement).toBeVisible();
    expect(suspendedBy).toBeVisible();
  });

  describe('a suspended tenant with the reactivate dialog open', () => {
    let confirmButton: HTMLElement;

    beforeEach(async () => {
      setup();

      const openDialog = screen.getByRole('button', {
        name: SUSPENDED.triggerButton,
      });
      await user.click(openDialog);
      confirmButton = await screen.findByRole('button', {
        name: SUSPENDED.confirmButton,
      });
    });

    it('reactivates the tenant', async () => {
      await user.click(confirmButton);

      expect(liftTenantSuspensionActionMock).toHaveBeenCalledWith(
        SUSPENDED_TENANT.id,
      );
      expect(suspendTenantActionMock).not.toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
    });

    it('offers no block choice', () => {
      const blockSwitch = screen.queryByRole('switch', {
        name: blockOwner.switchLabel,
      });

      expect(blockSwitch).not.toBeInTheDocument();
    });
  });
});
