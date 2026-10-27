import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import en from '@platform/i18n/messages/en.json';
import { MOCK_BLOCK_REASON } from '@platform/testing/blocked-signups/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
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

const { tenantSuspensionControl, tenantLifecycleErrors } = en;
const { ACTIVE, SUSPENDED, blockOwner } = tenantSuspensionControl;
const t = makeEnTranslator('tenantSuspensionControl');

const ACTIVE_TENANT = mockClientTenant({ status: TENANT_STATUS.ACTIVE });
const SUSPENDED_TENANT = mockClientTenant({ status: TENANT_STATUS.SUSPENDED });

const setup = customRender(TenantSuspensionControl, { tenant: ACTIVE_TENANT });

describe(`<${TenantSuspensionControl.name}/>`, () => {
  let refreshMock: ReturnType<typeof mockRouterRefresh>;
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
    refreshMock = mockRouterRefresh();
  });

  describe('an active tenant with the suspend dialog open', () => {
    const findConfirmButton = () =>
      screen.findByRole('button', { name: ACTIVE.confirmButton });

    const chooseToBlockOwner = async () => {
      const blockSwitch = await screen.findByRole('switch', {
        name: blockOwner.switchLabel,
      });
      await user.click(blockSwitch);
    };

    const enterBlockReason = async () => {
      const reasonField = screen.getByRole('textbox', {
        name: blockOwner.reasonLabel,
      });
      await user.type(reasonField, MOCK_BLOCK_REASON);
    };

    beforeEach(async () => {
      setup();

      const openDialog = screen.getByRole('button', {
        name: ACTIVE.triggerButton,
      });
      await user.click(openDialog);
    });

    it('suspends only after the operator confirms', async () => {
      const dialog = await screen.findByRole('alertdialog', {
        name: t('ACTIVE.dialogTitle', { name: ACTIVE_TENANT.name }),
      });
      const consequence = screen.getByText(ACTIVE.dialogDescription);

      expect(dialog).toBeVisible();
      expect(consequence).toBeVisible();
      expect(suspendTenantActionMock).not.toHaveBeenCalled();

      const confirmButton = await findConfirmButton();
      await user.click(confirmButton);

      expect(suspendTenantActionMock).toHaveBeenCalledWith(ACTIVE_TENANT.id);
      expect(liftTenantSuspensionActionMock).not.toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
    });

    it('keeps the dialog open with the refusal for a tenant archived meanwhile', async () => {
      suspendTenantActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ARCHIVED,
      });

      const confirmButton = await findConfirmButton();
      await user.click(confirmButton);

      const refusal = await screen.findByText(tenantLifecycleErrors.archived);

      expect(refusal).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('also blocks the owner email with the entered reason when chosen', async () => {
      await chooseToBlockOwner();
      await enterBlockReason();

      const confirmButton = await findConfirmButton();
      await user.click(confirmButton);

      expect(suspendTenantActionMock).toHaveBeenCalledWith(ACTIVE_TENANT.id, {
        reason: MOCK_BLOCK_REASON,
      });
    });

    it('cannot confirm a block until a reason is entered', async () => {
      await chooseToBlockOwner();

      const confirmButton = await findConfirmButton();

      expect(confirmButton).toBeDisabled();
    });

    it('keeps the dialog open with the refusal when the owner has no email on record', async () => {
      suspendTenantActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN,
      });

      await chooseToBlockOwner();
      await enterBlockReason();
      const confirmButton = await findConfirmButton();
      await user.click(confirmButton);

      const refusal = await screen.findByText(
        tenantLifecycleErrors.ownerEmailUnknown,
      );

      expect(refusal).toBeVisible();
      expect(refreshMock).not.toHaveBeenCalled();
    });
  });

  describe('a suspended tenant with the reactivate dialog open', () => {
    beforeEach(async () => {
      setup({ tenant: SUSPENDED_TENANT });

      const openDialog = screen.getByRole('button', {
        name: SUSPENDED.triggerButton,
      });
      await user.click(openDialog);
    });

    it('reactivates the tenant', async () => {
      const confirmButton = await screen.findByRole('button', {
        name: SUSPENDED.confirmButton,
      });
      await user.click(confirmButton);

      expect(liftTenantSuspensionActionMock).toHaveBeenCalledWith(
        SUSPENDED_TENANT.id,
      );
      expect(suspendTenantActionMock).not.toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
    });

    it('offers no block choice', async () => {
      await screen.findByRole('button', { name: SUSPENDED.confirmButton });

      const blockSwitch = screen.queryByRole('switch', {
        name: blockOwner.switchLabel,
      });

      expect(blockSwitch).not.toBeInTheDocument();
    });
  });
});
