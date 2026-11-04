import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { waitFor } from '@platform/testing/custom-render';
import { savedLookValues } from '@platform/testing/look/look-form-fixtures';
import { clickSave } from '@platform/testing/look/look-form-interactions';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type { UserEvent } from '@testing-library/user-event';

export const saveAndExpectLook = async (
  user: UserEvent,
  saved: Partial<TLookFormValues>,
) => {
  await clickSave(user);

  await waitFor(() => {
    expect(updateLookAction).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      savedLookValues(saved),
    );
  });
};
