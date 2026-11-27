import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { deprovisionTenantAction } from '@platform/server/provisioning/deprovision-tenant-action';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  CONFIRM_TENANT_NAME_LABEL,
  mockClientTenant,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeprovisionTenantControl } from './deprovision-tenant-control';

vi.mock('@platform/server/provisioning/deprovision-tenant-action');

const deprovisionTenantActionMock = vi.mocked(deprovisionTenantAction);

const MOCK_CLIENT_TENANT = mockClientTenant({ deprovisionedAt: null });

const setup = customRender(DeprovisionTenantControl, {
  tenant: MOCK_CLIENT_TENANT,
});

const DEPROVISION = 'Deprovision';
const DEPROVISION_DIALOG_TITLE = `Deprovision ${MOCK_TENANT_NAME}`;
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

  describe('with no run in progress', () => {
    beforeEach(() => {
      setup();
    });

    it('titles the card "Deprovision this tenant"', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: 'Deprovision this tenant',
      });

      expect(heading).toBeVisible();
    });

    it('does not duplicate a "Danger zone" heading inside the card', () => {
      const dangerZoneText = screen.queryByText('Danger zone');

      expect(dangerZoneText).not.toBeInTheDocument();
    });

    describe('with the confirm dialog open', () => {
      let dialog: HTMLElement;

      beforeEach(async () => {
        dialog = await openDialog(user);
      });

      it('opens a confirm dialog requiring the tenant name, disabled until it matches', async () => {
        const confirmButton = within(dialog).getByRole('button', {
          name: DEPROVISION,
        });

        expect(dialog).toBeVisible();
        expect(confirmButton).toBeDisabled();
      });

      it('calls the action with the typed name, then refreshes', async () => {
        await typeTenantNameAndConfirm(user, dialog);

        expect(deprovisionTenantActionMock).toHaveBeenCalledWith(
          MOCK_CLIENT_TENANT.id,
          { confirm: MOCK_TENANT_NAME },
        );
        await vi.waitFor(() => expect(refreshMock).toHaveBeenCalled());
      });

      it.each([
        {
          failure: 'a name mismatch',
          result: {
            outcome: ACTION_OUTCOME.INVALID,
            fieldErrors: {
              confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH },
            },
          },
          message: "Doesn't match the tenant's name.",
        },
        {
          failure: 'a deprovision already underway',
          result: {
            outcome: ACTION_OUTCOME.REFUSED,
            reason: TENANT_REFUSAL.DEPROVISION_UNDERWAY,
          },
          message:
            'Deprovisioning is already requested or running for this tenant.',
        },
      ])(
        'shows $failure inline and never refreshes',
        async ({ result, message }) => {
          deprovisionTenantActionMock.mockResolvedValue(result);
          await typeTenantNameAndConfirm(user, dialog);

          const error = await screen.findByText(message);

          expect(error).toBeVisible();
          expect(refreshMock).not.toHaveBeenCalled();
        },
      );
    });

    it('offers an enabled trigger with no hint when no run is in progress', () => {
      const trigger = screen.getByRole('button', { name: DEPROVISION });
      const hint = screen.queryByText(RUN_IN_PROGRESS_HINT);

      expect(trigger).toBeEnabled();
      expect(hint).not.toBeInTheDocument();
    });
  });

  describe('with a run in progress', () => {
    it('blocks the trigger and explains why while a run is in progress', () => {
      setup({ isDeprovisioningInProgress: true });

      const trigger = screen.getByRole('button', { name: DEPROVISION });

      expect(trigger).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
      expect(trigger).not.toBeDisabled();
      expect(trigger).toHaveAccessibleDescription(RUN_IN_PROGRESS_HINT);
    });
  });
});
