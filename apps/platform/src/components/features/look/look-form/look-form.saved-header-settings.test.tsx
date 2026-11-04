import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  SPINNER_STYLE,
} from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { HEADER_LAYOUT_LABEL } from '@platform/testing/look/look-form-fixtures';
import {
  chooseEditorial,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { MOCK_LOGO_URL } from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
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

  describe('after choosing a preset over saved non-theme settings', () => {
    beforeEach(async () => {
      setupLookForm({
        initialValues: {
          ...defaultLookFormValues(),
          logo: { url: MOCK_LOGO_URL },
          headerLayout: HEADER_LAYOUT.CENTRED_BRAND,
          headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
          headerBarStyle: HEADER_BAR_STYLE.FLOATING,
          accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
          accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB,
          accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
          busyButtonStyle: BUSY_BUTTON_STYLE.KEPT,
          spinnerStyle: SPINNER_STYLE.DOTS,
          footerLayout: FOOTER_LAYOUT.COMPACT,
          footerBackground: BRAND_VARIANT.SECONDARY,
          footerSurface: FOOTER_SURFACE.CARD,
          cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
        },
      });
      await chooseEditorial(user);
    });

    it.each([
      {
        row: LOOK_ROW.HEADER,
        select: HEADER_LAYOUT_LABEL,
        option: LOOK_FORM.headerLayoutOptionLabel.CENTRED_BRAND,
      },
    ])('keeps the saved $select', async ({ row, select, option }) => {
      await openLookRow(user, row);

      const selectBox = screen.getByRole('combobox', { name: select });

      expect(selectBox).toHaveTextContent(option);
    });
    it.each([
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerSubmenuStyleLabel,
        option: LOOK_FORM.headerSubmenuStyleOptionLabel.WIDE_PANEL,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerBarStyleLabel,
        option: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountButtonStyleLabel,
        option: LOOK_FORM.accountButtonStyleOptionLabel.CIRCLE,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPanelStyleLabel,
        option: LOOK_FORM.accountPanelStyleOptionLabel.HUB,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPhonePlacementLabel,
        option: LOOK_FORM.accountPhonePlacementOptionLabel.MENU,
      },
    ])('keeps the saved $group', async ({ row, group, option }) => {
      await openLookRow(user, row);

      const styleGroup = screen.getByRole('group', { name: group });
      const optionButton = within(styleGroup).getByRole('button', {
        name: option,
      });

      expect(optionButton).toHaveAttribute(ARIA_PRESSED, 'true');
    });
  });
});
