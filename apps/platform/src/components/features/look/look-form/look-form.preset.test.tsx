import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import messages from '@platform/i18n/messages/en.json';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { screen } from '@platform/testing/custom-render';
import {
  CONSOLE,
  EDITORIAL,
  EDITORIAL_ACCENT_HUE,
  hueValue,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseEditorial,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
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

    it('selects a preset with the arrow keys and applies it to the form', async () => {
      const consolePreset = screen.getByRole('radio', { name: CONSOLE });
      const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
      await user.click(consolePreset);
      await user.keyboard('{ArrowRight}');
      await openLookRow(user, LOOK_ROW.COLOUR);

      const hueReadout = screen.getByText(hueValue(EDITORIAL_ACCENT_HUE));
      expect(editorialPreset).toBeChecked();
      expect(hueReadout).toBeVisible();
      expect(updateLookAction).not.toHaveBeenCalled();
    });

    describe('after choosing the Editorial preset', () => {
      beforeEach(async () => {
        await chooseEditorial(user);
        await openLookRow(user, LOOK_ROW.COLOUR);
      });

      it('marks no unsaved change on the Preset title', () => {
        const presetHeading = screen.getByRole('heading', {
          name: LOOK_FORM.presetLabel,
        });

        expect(presetHeading).toBeVisible();
      });

      it("resets the accent hue to the preset's", () => {
        const hueReadout = screen.getByText(hueValue(EDITORIAL_ACCENT_HUE));

        expect(hueReadout).toBeVisible();
      });

      it("previews the preset's card style", () => {
        const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);

        expect(sampleTokens).toHaveStyle({ '--item-border-width': '1px' });
      });
    });
  });
});
