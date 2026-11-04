import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
} from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default values', () => {
    beforeEach(() => {
      setupLookForm();
    });

    it.each([
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountButtonStyleLabel,
        option: LOOK_FORM.accountButtonStyleOptionLabel.CIRCLE,
        saved: { accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE },
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPanelStyleLabel,
        option: LOOK_FORM.accountPanelStyleOptionLabel.HUB,
        saved: { accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB },
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPhonePlacementLabel,
        option: LOOK_FORM.accountPhonePlacementOptionLabel.MENU,
        saved: { accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU },
      },
    ])(
      'saves the chosen $group style',
      async ({ row, group, option, saved }) => {
        await openLookRow(user, row);
        const [styleGroup] = screen.getAllByRole('group', { name: group });
        const optionButton = within(styleGroup!).getByRole('button', {
          name: option,
        });
        await user.click(optionButton);

        await saveAndExpectLook(user, saved);
      },
    );
  });
});
