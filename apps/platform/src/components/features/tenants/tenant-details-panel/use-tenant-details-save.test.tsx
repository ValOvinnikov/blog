import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import messages from '@platform/i18n/messages/en.json';
import {
  act,
  renderHookWithIntl,
  screen,
} from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  mockClientTenant,
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { tenantDetailsValuesOf } from './tenant-details-values';
import { useTenantDetailsSave } from './use-tenant-details-save';

const { updateTenantDetailsActionMock } = vi.hoisted(() => ({
  updateTenantDetailsActionMock: vi.fn(),
}));

vi.mock('@platform/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: updateTenantDetailsActionMock,
}));

const { errors, alertSuccess } = messages.tenantDetailsPanel;

const MOCK_VALUES = tenantDetailsValuesOf(mockClientTenant(), MOCK_OWNER_EMAIL);
const DOMAIN_TAKEN_ERRORS = {
  primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
};

const FORM_ERROR_CASES = [
  {
    result: {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    },
    message: errors.notFound,
  },
  {
    result: {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    },
    message: errors.archived,
  },
  {
    result: {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.LOCALE_IS_ADDITIONAL,
    },
    message: errors.localeIsAdditional,
  },
  {
    result: {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.PROVISIONING_STARTED,
    },
    message: errors.provisioningStarted,
  },
  {
    result: {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
    },
    message: errors.ownerAlreadyJoined,
  },
  {
    result: {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
    },
    message: errors.ownerHasFreeTenant,
  },
  {
    result: { outcome: ACTION_OUTCOME.SERVER_ERROR },
    message: errors.saveFailed,
  },
];

const renderSave = () =>
  renderHookWithIntl(() => useTenantDetailsSave(MOCK_TENANT_ID, MOCK_VALUES));

const saveWith = async (result: ReturnType<typeof renderSave>['result']) => {
  let isSaved = false;
  await act(async () => {
    isSaved = await result.current.save();
  });
  return isSaved;
};

describe(useTenantDetailsSave, () => {
  let refreshMock: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    updateTenantDetailsActionMock.mockReset();
    refreshMock = mockRouterRefresh();
  });

  it('saves the values, confirms with a toast and refreshes', async () => {
    updateTenantDetailsActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      tenant: mockClientTenant(),
    });
    const { result } = renderSave();

    const isSaved = await saveWith(result);

    expect(isSaved).toBe(true);
    expect(updateTenantDetailsActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_VALUES,
    );
    expect(await screen.findByText(alertSuccess)).toBeVisible();
    expect(refreshMock).toHaveBeenCalled();
  });

  it('returns the field errors of an invalid save, without a toast or refresh', async () => {
    updateTenantDetailsActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: DOMAIN_TAKEN_ERRORS,
    });
    const { result } = renderSave();

    const isSaved = await saveWith(result);

    expect(isSaved).toBe(false);
    expect(result.current.fieldErrors).toEqual(DOMAIN_TAKEN_ERRORS);
    expect(result.current.formError).toBeUndefined();
    expect(screen.queryByText(alertSuccess)).not.toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it.each(FORM_ERROR_CASES)(
    'states why the save failed ($result.outcome $result.reason)',
    async ({ result: actionResult, message }) => {
      updateTenantDetailsActionMock.mockResolvedValue(actionResult);
      const { result } = renderSave();

      const isSaved = await saveWith(result);

      expect(isSaved).toBe(false);
      expect(result.current.formError).toBe(message);
      expect(refreshMock).not.toHaveBeenCalled();
    },
  );

  it('clears the previous errors', async () => {
    updateTenantDetailsActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: DOMAIN_TAKEN_ERRORS,
    });
    const { result } = renderSave();
    await saveWith(result);

    act(() => result.current.clearErrors());

    expect(result.current.fieldErrors).toEqual({});
  });
});
