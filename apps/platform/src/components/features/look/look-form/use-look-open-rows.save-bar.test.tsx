import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import {
  lookRowTrigger,
  nudgeAccentHue,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { UNSAVED_CHANGES } from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { useLookOpenRows } from './use-look-open-rows';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

describe(useLookOpenRows, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setupLookForm();
  });

  describe('from the save bar link to a changed card', () => {
    let colourTrigger: HTMLElement;

    beforeEach(async () => {
      await nudgeAccentHue(user);
      await openLookRow(user, LOOK_ROW.FOOTER);
      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const colourLink = within(saveBar).getByRole('button', {
        name: LOOK_FORM.colourHeading,
      });
      await user.click(colourLink);
      colourTrigger = lookRowTrigger(LOOK_ROW.COLOUR);
    });

    it('opens the changed row and folds the open one', () => {
      const footerTrigger = lookRowTrigger(LOOK_ROW.FOOTER);

      expect(colourTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(footerTrigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('moves focus to the changed row button', () => {
      expect(colourTrigger).toHaveFocus();
    });
  });
});
