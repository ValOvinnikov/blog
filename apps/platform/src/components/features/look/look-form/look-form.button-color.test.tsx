import { LOOK_ROW } from '@platform/constants/look-row';
import { SITE_THEME_BUTTON_STYLE_TEST_ID } from '@platform/constants/site-theme-frame';
import { screen } from '@platform/testing/custom-render';
import {
  BUTTON_COLOR_DARK_FOLLOWS,
  BUTTON_COLOR_FOLLOWS_ACCENT,
  followSwitch,
  hexInputs,
  pickButtonColor,
} from '@platform/testing/look/look-button-color';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  MOCK_PINK_HEX,
  MOCK_YELLOW_HEX,
} from '@shinefold/config/testing/button-colors';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const buttonStyles = () =>
  screen.queryAllByTestId(SITE_THEME_BUTTON_STYLE_TEST_ID);

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('on Growth', () => {
    beforeEach(async () => {
      setupLookForm();
      await openLookRow(user, LOOK_ROW.COLOUR);
    });

    it('keeps the buttons on the accent until a colour is picked', () => {
      const accentSwitch = followSwitch(BUTTON_COLOR_FOLLOWS_ACCENT);

      expect(accentSwitch).toBeChecked();
      expect(buttonStyles()).toHaveLength(0);
    });

    describe('with a colour picked', () => {
      beforeEach(async () => {
        await pickButtonColor(user, MOCK_YELLOW_HEX);
      });

      it('previews it on every button', () => {
        const [buttonStyle] = buttonStyles();

        expect(buttonStyle).toHaveTextContent(MOCK_YELLOW_HEX);
      });

      it('previews a picked dark-ground colour', async () => {
        const darkSwitch = followSwitch(BUTTON_COLOR_DARK_FOLLOWS);
        await user.click(darkSwitch);
        const [, darkHexInput] = hexInputs();
        await user.clear(darkHexInput!);
        await user.type(darkHexInput!, MOCK_PINK_HEX);

        const [buttonStyle] = buttonStyles();
        expect(buttonStyle).toHaveTextContent(MOCK_PINK_HEX);
      });

      it('returns the preview to the accent when the colour is cleared', async () => {
        const accentSwitch = followSwitch(BUTTON_COLOR_FOLLOWS_ACCENT);

        await user.click(accentSwitch);

        expect(buttonStyles()).toHaveLength(0);
      });

      it('saves it', async () => {
        await saveAndExpectLook(user, { buttonColor: MOCK_YELLOW_HEX });
      });
    });
  });
});
