import type { TLookRow } from '@platform/constants/look-row';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { savedLookValues } from '@platform/testing/look/look-form-fixtures';
import {
  clickSave,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
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

type TChosenStyle = {
  row: TLookRow;
  group: string;
  option: string;
  saved: Partial<TLookFormValues>;
};

export const saveChosenStyle = async (
  user: UserEvent,
  { row, group, option, saved }: TChosenStyle,
) => {
  await openLookRow(user, row);
  const [styleGroup] = screen.getAllByRole('group', { name: group });
  const optionButton = within(styleGroup!).getByRole('button', {
    name: option,
  });
  await user.click(optionButton);

  await saveAndExpectLook(user, saved);
};
