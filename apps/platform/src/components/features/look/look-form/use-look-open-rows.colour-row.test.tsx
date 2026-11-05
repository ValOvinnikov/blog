import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import {
  ACCENT_HUE,
  NUDGED_ACCENT_HUE,
  RESET_TO_PRESET,
} from '@platform/testing/look/look-form-fixtures';
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

  describe('with the Colour row open', () => {
    beforeEach(async () => {
      await openLookRow(user, LOOK_ROW.COLOUR);
    });

    it('names an open row body after the row title', () => {
      const body = screen.getByRole('group', { name: LOOK_FORM.colourHeading });
      const slider = within(body).getByRole('slider', { name: ACCENT_HUE });

      expect(slider).toBeVisible();
    });

    describe('with the accent hue nudged', () => {
      beforeEach(async () => {
        await nudgeAccentHue(user);
      });

      describe('with the Colour row folded again', () => {
        let colourTrigger: HTMLElement;

        beforeEach(async () => {
          colourTrigger = lookRowTrigger(LOOK_ROW.COLOUR);
          await user.click(colourTrigger);
        });

        it('keeps a typed value when its row opens again', async () => {
          await user.click(colourTrigger);

          const slider = screen.getByRole('slider', { name: ACCENT_HUE });
          expect(slider).toHaveValue(String(NUDGED_ACCENT_HUE));
        });

        it('shows the unsaved dot on the changed row only', () => {
          const dots = screen.getAllByRole('img', { name: UNSAVED_CHANGES });
          const colourDot = within(colourTrigger).getByRole('img', {
            name: UNSAVED_CHANGES,
          });
          expect(dots).toEqual([colourDot]);
        });
      });

      it('keeps Reset to preset on a card that is not a folding row', () => {
        const presetTrigger = screen.queryByRole('button', {
          name: LOOK_FORM.presetLabel,
        });
        const resetButton = screen.getByRole('button', {
          name: RESET_TO_PRESET,
        });

        expect(presetTrigger).not.toBeInTheDocument();
        expect(resetButton).toBeVisible();
      });
    });
  });
});
