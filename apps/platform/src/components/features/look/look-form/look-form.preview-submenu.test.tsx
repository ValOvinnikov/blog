import { HEADER_SUBMENU_STYLE } from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import {
  SAMPLE_SUBMENU_STYLE_ATTRIBUTE,
  SAMPLE_SUBMENU_TEST_ID,
} from '@platform/constants/sample-header';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
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

  describe('the preview sub-menu', () => {
    let submenuGroup: HTMLElement;

    beforeEach(async () => {
      setupLookForm();
      await openLookRow(user, LOOK_ROW.HEADER);
      submenuGroup = screen.getByRole('group', {
        name: LOOK_FORM.headerSubmenuStyleLabel,
      });
    });

    it('starts closed', () => {
      const submenu = screen.queryByTestId(SAMPLE_SUBMENU_TEST_ID);

      expect(submenu).not.toBeInTheDocument();
    });

    it('opens while the Sub-menus field is hovered', async () => {
      await user.hover(submenuGroup);

      const openSubmenu = screen.getByTestId(SAMPLE_SUBMENU_TEST_ID);
      expect(openSubmenu).toHaveAttribute(
        SAMPLE_SUBMENU_STYLE_ATTRIBUTE,
        HEADER_SUBMENU_STYLE.DROPDOWN,
      );

      await user.unhover(submenuGroup);

      const closedSubmenu = screen.queryByTestId(SAMPLE_SUBMENU_TEST_ID);
      expect(closedSubmenu).not.toBeInTheDocument();
    });

    it('shows the picked style and stays open while the field keeps focus', async () => {
      const wideButton = within(submenuGroup).getByRole('button', {
        name: LOOK_FORM.headerSubmenuStyleOptionLabel.WIDE_PANEL,
      });
      await user.click(wideButton);
      await user.unhover(submenuGroup);

      const openSubmenu = screen.getByTestId(SAMPLE_SUBMENU_TEST_ID);
      expect(openSubmenu).toHaveAttribute(
        SAMPLE_SUBMENU_STYLE_ATTRIBUTE,
        HEADER_SUBMENU_STYLE.WIDE_PANEL,
      );

      await user.click(document.body);

      const closedSubmenu = screen.queryByTestId(SAMPLE_SUBMENU_TEST_ID);
      expect(closedSubmenu).not.toBeInTheDocument();
    });
  });
});
