import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { within } from '@platform/testing/custom-render';
import { HEADER_LAYOUT_LABEL } from '@platform/testing/look/look-form-fixtures';
import {
  chooseOption,
  chooseSegment,
  lookRowTrigger,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import {
  saveAndExpectLook,
  saveChosenStyle,
} from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { UNSAVED_CHANGES } from '@platform/testing/render-in-settings-form';
import {
  BRAND_VARIANT,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  NAV_LINK_STYLE,
} from '@shinefold/config';
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
        group: LOOK_FORM.headerControlStyleLabel,
        option: LOOK_FORM.headerControlStyleOptionLabel.SOFT,
        saved: { headerControlStyle: HEADER_CONTROL_STYLE.SOFT },
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerSubmenuStyleLabel,
        option: LOOK_FORM.headerSubmenuStyleOptionLabel.WIDE_PANEL,
        saved: { headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL },
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerBarStyleLabel,
        option: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
        saved: { headerBarStyle: HEADER_BAR_STYLE.FLOATING },
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.navLinkStyleLabel,
        option: LOOK_FORM.navLinkStyleOptionLabel.SOFT,
        saved: { navLinkStyle: NAV_LINK_STYLE.SOFT },
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerBackgroundLabel,
        option: LOOK_FORM.skinLabel.INK,
        saved: { headerBackground: BRAND_VARIANT.INK },
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.breadcrumbBackgroundLabel,
        option: LOOK_FORM.skinLabel.BRAND_PRIMARY,
        saved: { breadcrumbBackground: BRAND_VARIANT.BRAND_PRIMARY },
      },
    ])('saves the chosen $group style', (style) =>
      saveChosenStyle(user, style),
    );

    it.each([
      {
        row: LOOK_ROW.HEADER,
        select: HEADER_LAYOUT_LABEL,
        option: LOOK_FORM.headerLayoutOptionLabel.TWO_ROWS,
        saved: { headerLayout: HEADER_LAYOUT.TWO_ROWS },
      },
    ])('saves the chosen $select', async ({ row, select, option, saved }) => {
      await openLookRow(user, row);
      await chooseOption(user, select, option);

      await saveAndExpectLook(user, saved);
    });

    it('marks an unsaved header buttons change on the Header row, not on Shape', async () => {
      await openLookRow(user, LOOK_ROW.HEADER);
      await chooseSegment(
        user,
        LOOK_FORM.headerControlStyleLabel,
        LOOK_FORM.headerControlStyleOptionLabel.PLAIN,
      );

      const headerDot = within(lookRowTrigger(LOOK_ROW.HEADER)).queryByRole(
        'img',
        { name: UNSAVED_CHANGES },
      );
      const shapeDot = within(lookRowTrigger(LOOK_ROW.SHAPE)).queryByRole(
        'img',
        { name: UNSAVED_CHANGES },
      );
      expect(headerDot).toBeInTheDocument();
      expect(shapeDot).not.toBeInTheDocument();
    });
  });
});
